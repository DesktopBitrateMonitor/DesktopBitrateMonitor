import WebSocket from 'ws';
import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { handleChatMessage } from './handleChatMessage';
import { handleRaid } from './handelRaids';

const WS_ENDPOINT =
  'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false';
const HEARTBEAT_CHECK_INTERVAL_MS = 10000;
const HEARTBEAT_TIMEOUT_MS = 30000;
const RECONNECT_DELAY_MS = 5000;
const SUBSCRIBE_RETRY_ATTEMPTS = 3;
const ACTIVITY_TIMEOUT_FALLBACK_MS = 120000;

let ws = null;
let heartbeatInterval = null;
let lastPongAt = Date.now();
let lastPingAt = Date.now();
let reconnecting = false;
let pingIntervalMs = ACTIVITY_TIMEOUT_FALLBACK_MS;
let heartbeatTimeoutMs = HEARTBEAT_TIMEOUT_MS;
let channelMeta = null;

const isDev = import.meta.env.DEV;

const { kickAccountsConfig } = injectDefaults();

export async function connectToKickEventSub(mainWindow = null) {
  const broadcasterConfig = kickAccountsConfig.get('broadcaster');
  const channelSlug = broadcasterConfig?.login;
  const channelId = broadcasterConfig?.channelId;
  const chatroomId = broadcasterConfig?.chatroomId;

  if (!channelSlug) {
    Logger.error('No Kick channel configured. Skipping Kick chat connection.');
    return;
  }

  channelMeta = { channelId, chatroomId, slug: channelSlug };

  if (!channelMeta) {
    mainWindow?.webContents.send('kick-chat-connection', {
      success: false,
      data: null,
      error: { message: 'Unable to resolve Kick channel metadata.' }
    });
    return;
  }

  await cleanupWebSocket();
  reconnecting = true;

  while (reconnecting) {
    try {
      Logger.info(`Connecting to Kick chat for ${channelMeta.slug}...`);
      await connectOnce(mainWindow);
      await waitForSocketExit();
    } catch (err) {
      Logger.error(`Kick chat connection failed: ${err.message}`);
    } finally {
      await cleanupWebSocket();
    }

    if (!reconnecting) {
      break;
    }

    Logger.warn(`Kick chat socket closed. Reconnecting in ${RECONNECT_DELAY_MS / 1000} seconds...`);
    await delay(RECONNECT_DELAY_MS);
  }
}

export async function disconnectKickEventSub(mainWindow = null) {
  Logger.info('Manual disconnect from Kick chat...');
  reconnecting = false;
  await cleanupWebSocket();
  mainWindow?.webContents.send('kick-chat-connection', {
    success: true,
    data: { message: 'Disconnected from Kick chat.' },
    error: null
  });
}

async function connectOnce(mainWindow = null) {
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
      Logger.success('Kick WebSocket connected.');
      lastPongAt = Date.now();
      lastPingAt = Date.now();
      startHeartbeatMonitor();
      safeResolve();
    });

    ws.on('message', (data) => {
      processMessage(data, mainWindow).catch((err) => {
        Logger.error(`Failed to process Kick message: ${err.message}`);
      });
    });

    ws.once('error', (err) => {
      Logger.error(`Kick WebSocket error: ${err.message}`);
      safeReject(err);
    });

    ws.once('close', () => {
      Logger.info('Kick WebSocket closed');
    });
  });
}

async function processMessage(rawMessage, mainWindow = null) {
  const message = safeJsonParse(rawMessage);
  if (!message) {
    return;
  }

  switch (message.event) {
    case 'pusher:connection_established': {
      const payload = safeJsonParse(message.data);
      pingIntervalMs = (payload?.activity_timeout ?? ACTIVITY_TIMEOUT_FALLBACK_MS / 1000) * 1000;
      heartbeatTimeoutMs = Math.max(pingIntervalMs + 10000, HEARTBEAT_TIMEOUT_MS);
      lastPongAt = Date.now();
      lastPingAt = Date.now();
      sendPing();
      await subscribeToChat();
      mainWindow?.webContents.send('kick-chat-connection', {
        success: true,
        data: { message: 'Connected to Kick chat.' },
        error: null
      });
      return;
    }
    case 'pusher:pong':
      lastPongAt = Date.now();
      return;
    case 'pusher_internal:subscription_succeeded':
      Logger.success(`Subscribed to ${message.channel}`);
      return;
    case 'App\\Events\\ChatMessageEvent':
      handleChatMessage(safeJsonParse(message.data));
      return;
    case 'App\\Events\\ChatMoveToSupportedChannelEvent':
      handleRaid(safeJsonParse(message.data));
      return;
    default:
      return;
  }
}

async function subscribeToChat() {
  if (!channelMeta) {
    return;
  }

  const subscriptions = [
    `channel.${channelMeta.channelId}`,
    `chatrooms.${channelMeta.chatroomId}.v2`
  ];

  for (const channel of subscriptions) {
    for (let attempt = 1; attempt <= SUBSCRIBE_RETRY_ATTEMPTS; attempt += 1) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const payload = {
        event: 'pusher:subscribe',
        data: { auth: '', channel }
      };

      try {
        ws.send(JSON.stringify(payload));
        break;
      } catch (err) {
        Logger.error(
          `Failed to subscribe to ${channel} (attempt ${attempt}/${SUBSCRIBE_RETRY_ATTEMPTS}): ${err.message}`
        );

        if (attempt === SUBSCRIBE_RETRY_ATTEMPTS) {
          ws.close(4002, 'Subscription failed');
          return;
        }

        await delay(250 * attempt);
      }
    }
  }
}

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
      Logger.error(`Error closing Kick WebSocket: ${err.message}`);
    }
    ws = null;
  }
}

function startHeartbeatMonitor() {
  stopHeartbeatMonitor();
  heartbeatInterval = setInterval(() => {
    const now = Date.now();

    if (now - lastPongAt > heartbeatTimeoutMs) {
      Logger.error('Kick WebSocket heartbeat lost. Closing connection.');
      ws?.close(4000, 'Heartbeat timeout');
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN && now - lastPingAt >= pingIntervalMs) {
      sendPing();
    }
  }, HEARTBEAT_CHECK_INTERVAL_MS);
}

function sendPing() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
    lastPingAt = Date.now();
  } catch (err) {
    Logger.error(`Failed to send Kick ping: ${err.message}`);
  }
}

function stopHeartbeatMonitor() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

async function waitForSocketExit() {
  if (!ws) {
    return;
  }

  await new Promise((resolve) => {
    const finalize = () => resolve();

    ws.once('close', finalize);
    ws.once('error', finalize);
  });
}

function safeJsonParse(raw) {
  try {
    const value = typeof raw === 'string' ? raw : raw.toString();
    return JSON.parse(value);
  } catch (err) {
    Logger.error(`Failed to parse Kick payload: ${err.message}`);
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
