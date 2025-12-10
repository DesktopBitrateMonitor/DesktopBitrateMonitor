import Logger from '../../logger';
import { getEventTypes } from './eventsub-types';
import { handleEventSub } from './eventsub-message-handler';
import { getUsers } from '../twitch-api';
import { injectDefaults } from '../../store/defaults';

let ws = null;
let heartbeatInterval = null;
let lastKeepAliveMessage = Date.now();
let reconnecting = false;

// Main entry
export async function connectToEventSubs(client_id) {

  const {twitchBotConfig, twitchChannelConfig} = injectDefaults()

  await cleanupWebSocket();

  reconnecting = true;

  while (reconnecting) {
    try {
      const bot = twitchBotConfig.get('');
      const channels = twitchChannelConfig.get('channel');
      Logger.info('Attempting to connect to Twitch EventSub WebSocket...');
      await connectOnce(client_id, bot, channels);

      // Wait here until the connection is closed or errored
      await new Promise((resolve) => {
        ws.on('close', resolve);
        ws.on('error', resolve);
      });

      Logger.warn('WebSocket closed or errored. Reconnecting in 5 seconds...');
    } catch (err) {
      Logger.error(`Connection failed: ${err.message}`);
    }

    await cleanupWebSocket();
    await new Promise((res) => setTimeout(res, 5000));
  }
}

// One connection attempt
async function connectOnce(client_id, bot, channels) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

    ws.on('open', async () => {
      Logger.success('WebSocket connected.');
      lastKeepAliveMessage = Date.now();

      heartbeatInterval = setInterval(() => {
        if (Date.now() - lastKeepAliveMessage > 30000) {
          Logger.error('WebSocket heartbeat lost. Terminating...');
          if (ws) {
            ws.close();
          }
        }
      }, 10000);

      resolve();
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data);

      if (message.metadata?.message_type === 'ping') {
        ws.send(JSON.stringify({ metadata: { message_type: 'pong' } }));
        console.log('Sent pong');
        return;
      }

      if (message.metadata?.message_type === 'session_keepalive') {
        lastKeepAliveMessage = Date.now();
        return;
      }

      if (message.metadata?.message_type === 'session_welcome') {
        const sessionId = message.payload.session.id;
        await subscribeToMultipleEvents(channels, bot, client_id, sessionId);
      }

      if (Object.keys(message.payload).length > 0) {
        handleEventSub(message.payload);
        lastKeepAliveMessage = Date.now();
      }
    });

    ws.on('error', (err) => {
      Logger.error(`WebSocket error: ${err.message}`);
      reject(err);
    });

    ws.on('close', () => {
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
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (ws) {
    try {
      ws.close();
    } catch (err) {
      Logger.warn(`Error terminating WebSocket: ${err.message}`);
    }
    ws = null;
  }
}

// Subscription logic
export async function subscribeToMultipleEvents(channels, bot, client_id, sessionId) {
  if (!channels || channels.length === 0) {
    Logger.error('No channels to subscribe to');
    return { success: false };
  }

  for (const c of channels) {
    const broadcaster_id = await getUsers(bot.access_token, { user_name: c });
    const eventTypes = getEventTypes(broadcaster_id, bot);

    for (const event of eventTypes) {
      const { type, version, condition } = event;
      await subscribeToEvent(c, bot, client_id, type, version, condition, sessionId);
    }
  }
}

async function subscribeToEvent(c, bot, client_id, type, version, condition, sessionId) {
  try {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bot.access_token}`,
        'Client-ID': client_id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        version,
        condition,
        transport: {
          method: 'websocket',
          session_id: sessionId
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      Logger.error(`Failed to subscribe to ${type}: ${JSON.stringify(error)}`);
      return null;
    }

    const { data } = await response.json();

    if (data[0]?.type === 'channel.chat.message') {
      Logger.success(`Joined channel ${capitalize(c)}`);
    }

    if (data[0]?.type === 'channel.raid') {
      Logger.success(`Subscribed to raid event for ${capitalize(c)}`);
    }

    return data;
  } catch (err) {
    Logger.error(`Error subscribing to ${type}: ${err.message}`);
    return null;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
