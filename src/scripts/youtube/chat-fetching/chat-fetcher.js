import { google } from 'googleapis';
import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { handleChatMessage } from './handleChatMessage';
import { createOAuth2Client } from '../youtube-api';

const LIVE_DISCOVERY_RETRY_MS = 5000;
const DEFAULT_CHAT_POLL_MS = 5000;

let discoveryTimeoutId = null;
let chatPollTimeoutId = null;
let activeLiveChatId = null;
let nextPageToken = null;
let isPollingStopped = false;

const { youtubeAccountsConfig } = injectDefaults();

export async function startYouTubeChatPolling(mainWindow = null) {
  await stopYouTubeChatPolling();

  const youtubeConfig = youtubeAccountsConfig.get('broadcaster');
  if (!youtubeConfig?.access_token || !youtubeConfig?.refresh_token) {
    Logger.error('No YouTube broadcaster auth found. Skipping YouTube chat polling.');
    return;
  }

  isPollingStopped = false;

  const client = createOAuth2Client({
    refresh_token: youtubeConfig.refresh_token,
    access_token: youtubeConfig.access_token,
    expiry_date: youtubeConfig.expiry_date
  });

  const youtube = google.youtube({ version: 'v3', auth: client });

  const waitForActiveLiveChat = async () => {
    if (isPollingStopped) return;

    const liveChatId = await getLiveChatId(youtube);
    if (!liveChatId) {
      Logger.info('No active YouTube live chat found. Retrying in 5000 ms.');
      discoveryTimeoutId = setTimeout(waitForActiveLiveChat, LIVE_DISCOVERY_RETRY_MS);
      return;
    }

    activeLiveChatId = liveChatId;
    nextPageToken = undefined;
    Logger.info('Active YouTube live chat found. Starting message polling.');
    await pollLiveChat(youtube);
  };

  await waitForActiveLiveChat();
}

async function pollLiveChat(youtube) {
  if (isPollingStopped || !activeLiveChatId) return;

  try {
    const response = await youtube.liveChatMessages.list({
      liveChatId: activeLiveChatId,
      part: 'id,snippet,authorDetails',
      maxResults: 2000,
      pageToken: nextPageToken
    });

    const messages = response.data.items || [];
    nextPageToken = response.data.nextPageToken;

    for (const message of messages) {
      await handleChatMessage(message);
    }

    const delay = response.data.pollingIntervalMillis ?? DEFAULT_CHAT_POLL_MS;
    chatPollTimeoutId = setTimeout(() => {
      void pollLiveChat(youtube);
    }, delay);
  } catch (error) {
    Logger.error(`Error fetching YouTube chat messages: ${error.message}`);

    activeLiveChatId = null;
    nextPageToken = null;

    if (!isPollingStopped) {
      discoveryTimeoutId = setTimeout(() => {
        void startYouTubeChatPolling();
      }, LIVE_DISCOVERY_RETRY_MS);
    }
  }
}

async function getLiveChatId(youtube) {
  try {
    const response = await youtube.liveBroadcasts.list({
      part: 'snippet,status',
      mine: true,
      broadcastType: 'all',
      maxResults: 1
    });

    const liveBroadcast = response.data.items?.[0];
    return liveBroadcast?.snippet?.liveChatId ?? null;
  } catch (error) {
    Logger.error(`Error fetching live chat ID: ${error.message}`);
    return null;
  }
}

export async function stopYouTubeChatPolling() {
  isPollingStopped = true;

  if (discoveryTimeoutId) {
    clearTimeout(discoveryTimeoutId);
    discoveryTimeoutId = null;
  }

  if (chatPollTimeoutId) {
    clearTimeout(chatPollTimeoutId);
    chatPollTimeoutId = null;
  }

  activeLiveChatId = null;
  nextPageToken = null;

  Logger.info('Stopped YouTube chat polling.');
}
