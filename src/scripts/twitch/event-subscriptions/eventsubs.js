import Logger from '../../logger';
import { getEventTypes } from './eventsub-types';
import { handleEventSub } from './eventsub-message-handler';
import { getUsers } from '../twitch-api';
import { injectDefaults } from '../../store/defaults';
import WebSocket from 'ws';

const WS_ENDPOINT = 'wss://eventsub.wss.twitch.tv/ws';
const SUBSCRIPTIONS_ENDPOINT = 'https://api.twitch.tv/helix/eventsub/subscriptions';
const HEARTBEAT_CHECK_INTERVAL_MS = 10000;
const HEARTBEAT_TIMEOUT_MS = 30000;
const RECONNECT_DELAY_MS = 5000;
const SUBSCRIBE_RETRY_ATTEMPTS = 3;

let ws = null;
let heartbeatInterval = null;
let lastKeepAliveMessage = Date.now();
let reconnecting = false;

// Main entry
export async function connectToEventSubs(clientId) {
  if (!clientId) {
    Logger.error('Twitch client ID is required before connecting to EventSub.');
    return;
  }

  const { accountsConfig } = injectDefaults();

  let bc = accountsConfig.get('broadcaster');

  if (!bc.access_token) {
    Logger.error('Missing Twitch bot credentials. Aborting EventSub connection.');
    return;
  }

  const channelLogin = bc.login;

  if (!channelLogin) {
    Logger.error('No Twitch channel configured. Skipping EventSub connection.');
    return;
  }

  await cleanupWebSocket();
  reconnecting = true;

  while (reconnecting) {
    try {
      Logger.info('Attempting to connect to Twitch EventSub WebSocket...');
      await connectOnce(clientId, bc);
      await waitForSocketExit();
    } catch (err) {
      Logger.error(`Connection failed: ${err.message}`);
    } finally {
      await cleanupWebSocket();
    }

    if (!reconnecting) {
      break;
    }

    Logger.warn(
      `WebSocket closed or errored. Reconnecting in ${RECONNECT_DELAY_MS / 1000} seconds...`
    );
    await delay(RECONNECT_DELAY_MS);
  }
}

// One connection attempt
async function connectOnce(clientId, bc) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_ENDPOINT);
    let settled = false;

    const safeResolve = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const safeReject = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    ws.once('open', () => {
      Logger.success('WebSocket connected.');
      lastKeepAliveMessage = Date.now();
      startHeartbeatMonitor();
      safeResolve();
    });

    ws.on('message', (data) => {
      processMessage(data, bc, clientId).catch((err) => {
        Logger.error(`Failed to process EventSub message: ${err.message}`);
      });
    });

    ws.once('error', (err) => {
      Logger.error(`WebSocket error: ${err.message}`);
      safeReject(err);
    });

    ws.once('close', () => {
      Logger.warn('WebSocket closed');
    });
  });
}

// Disconnect + cleanup
export async function disconnectEventSubs() {
  Logger.info('Manual disconnect from EventSub...');
  reconnecting = false;
  await cleanupWebSocket();
}

// Kill timers and socket
async function cleanupWebSocket() {
  stopHeartbeatMonitor();
  if (ws) {
    try {
      ws.removeAllListeners();
      if (typeof ws.terminate === 'function') {
        ws.terminate();
      } else {
        ws.close();
      }
    } catch (err) {
      Logger.warn(`Error terminating WebSocket: ${err.message}`);
    }
    ws = null;
  }
}

// Subscription logic
export async function subscribeToChannelEvents(bc, clientId, sessionId) {
  const channelName = bc.login;

  if (!channelName) {
    Logger.error('No channel login provided for EventSub subscription.');
    return { success: false };
  }

  try {
    const broadcaster = await getUsers(bc.access_token, { user_name: channelName });

    if (!broadcaster?.id) {
      Logger.error(`Unable to resolve broadcaster ID for ${channelName}.`);
      return { success: false };
    }

    const eventTypes = getEventTypes(broadcaster) || [];

    if (!eventTypes.length) {
      Logger.warn(`No EventSub definitions available for ${channelName}.`);
      return { success: true };
    }

    const results = await Promise.allSettled(
      eventTypes.map(({ type, version, condition }) =>
        subscribeToEvent(bc, clientId, type, version, condition, sessionId)
      )
    );

    const hadErrors = results.some((result) => {
      if (result.status === 'rejected') {
        return true;
      }
      return result.value === null;
    });

    if (hadErrors) {
      Logger.error(`One or more EventSub subscriptions failed for ${channelName}.`);
    }

    return { success: !hadErrors };
  } catch (err) {
    Logger.error(`Failed to subscribe to ${channelName}: ${err.message}`);
    return { success: false };
  }
}

async function subscribeToEvent(bc, clientId, type, version, condition, sessionId) {
  const payload = {
    type,
    version,
    condition,
    transport: {
      method: 'websocket',
      session_id: sessionId
    }
  };

  for (let attempt = 1; attempt <= SUBSCRIBE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(SUBSCRIPTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bc.access_token}`,
          'Client-ID': clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        Logger.error(
          `Failed to subscribe to ${type} for ${bc.display_name} (attempt ${attempt}/${SUBSCRIBE_RETRY_ATTEMPTS}): ${JSON.stringify(body)}`
        );
        if (attempt === SUBSCRIBE_RETRY_ATTEMPTS) {
          return null;
        }
        await delay(250 * attempt);
        continue;
      }

      const data = body?.data || [];

      if (data[0]?.type === 'channel.chat.message') {
        Logger.success(`Joined channel ${capitalize(bc.login)}`);
      } else if (data[0]?.type === 'channel.raid') {
        Logger.success(`Subscribed to raid event for ${capitalize(bc.login)}`);
      } else {
        Logger.success(`Subscribed to ${type} for ${capitalize(bc.login)}`);
      }

      return data;
    } catch (err) {
      Logger.error(
        `Error subscribing to ${type} for ${bc.display_name} (attempt ${attempt}/${SUBSCRIBE_RETRY_ATTEMPTS}): ${err.message}`
      );
      if (attempt === SUBSCRIBE_RETRY_ATTEMPTS) {
        return null;
      }
      await delay(250 * attempt);
    }
  }

  return null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function processMessage(rawMessage, bc, clientId) {
  const message = safeJsonParse(rawMessage);
  if (!message) {
    return;
  }

  const type = message.metadata?.message_type;

  switch (type) {
    case 'ping':
      sendPong();
      return;
    case 'session_keepalive':
      lastKeepAliveMessage = Date.now();
      return;
    case 'session_welcome': {
      lastKeepAliveMessage = Date.now();
      const sessionId = message.payload?.session?.id;
      if (!sessionId) {
        Logger.error('Missing session ID in welcome payload.');
        return;
      }
      await subscribeToChannelEvents(bc, clientId, sessionId);
      return;
    }
    case 'session_reconnect':
      Logger.warn('Twitch requested an EventSub session reconnect. Restarting socket...');
      ws?.close(4001, 'Reconnecting');
      return;
    default:
      break;
  }

  if (type === 'notification' && message.payload) {
    handleEventSub(message.payload);
    lastKeepAliveMessage = Date.now();
  }
}

function sendPong() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(JSON.stringify({ metadata: { message_type: 'pong' } }));
}

function startHeartbeatMonitor() {
  stopHeartbeatMonitor();
  heartbeatInterval = setInterval(() => {
    if (Date.now() - lastKeepAliveMessage > HEARTBEAT_TIMEOUT_MS) {
      Logger.error('WebSocket heartbeat lost. Terminating...');
      ws?.close(4000, 'Heartbeat timeout');
    }
  }, HEARTBEAT_CHECK_INTERVAL_MS);
}

function stopHeartbeatMonitor() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function safeJsonParse(raw) {
  try {
    const value = typeof raw === 'string' ? raw : raw.toString();
    return JSON.parse(value);
  } catch (err) {
    Logger.error(`Failed to parse EventSub message: ${err.message}`);
    return null;
  }
}

async function waitForSocketExit() {
  if (!ws) {
    return;
  }

  await new Promise((resolve) => {
    const finalize = () => {
      resolve();
    };

    ws.once('close', finalize);
    ws.once('error', finalize);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
