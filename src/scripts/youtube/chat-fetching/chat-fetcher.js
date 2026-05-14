import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { handleChatMessage } from './handleChatMessage';
import { isYoutubeReauthRequiredError, withYoutubeRetry } from '../../authorization/youtube-auth';

const { youtubeAccountsConfig } = injectDefaults();

let liveChatInstance = null;
let reconnectTimeoutId = null;
let keepConnectionLoopRunning = false;
let isConnecting = false;
let lastKnownLivestreamId = null;
let lastKnownLivestreamAt = 0;

const NO_STREAM_RETRY_DELAY_MS = 5 * 1000;
const CONNECTION_RETRY_DELAY_MS = 5 * 1000;
const LIVESTREAM_CACHE_TTL_MS = 2 * 60 * 1000;
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function rememberLivestreamId(livestreamId) {
  if (!livestreamId) {
    return;
  }

  lastKnownLivestreamId = livestreamId;
  lastKnownLivestreamAt = Date.now();
}

function clearRememberedLivestreamId() {
  lastKnownLivestreamId = null;
  lastKnownLivestreamAt = 0;
}

function isValidYoutubeVideoId(value) {
  return typeof value === 'string' && YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

function extractVideoId(candidate) {
  const candidateIds = [
    candidate?.video_id,
    candidate?.id,
    candidate?.content_id,
    candidate?.endpoint?.payload?.videoId,
    candidate?.navigationEndpoint?.payload?.videoId
  ];

  return candidateIds.find(isValidYoutubeVideoId) || null;
}

function collectLivestreamCandidateIds(liveStreamsTab) {
  const candidateIds = [];
  const seenIds = new Set();
  const videos = liveStreamsTab?.videos || [];
  const memoEntries = liveStreamsTab?.memo ? Array.from(liveStreamsTab.memo.values()).flat() : [];

  for (const candidate of [...videos, ...memoEntries]) {
    const videoId = extractVideoId(candidate);

    if (!videoId || seenIds.has(videoId)) {
      continue;
    }

    seenIds.add(videoId);
    candidateIds.push(videoId);
  }

  return candidateIds;
}

async function resolveLivestreamIdFromCandidates(yt, candidateIds) {
  for (const candidateId of candidateIds) {
    try {
      const response = await yt.getInfo(candidateId);
      const basicInfo = response?.basic_info || {};

      if (basicInfo?.is_live || basicInfo?.is_upcoming) {
        return candidateId;
      }
    } catch (error) {
      Logger.warn(
        `Failed to inspect YouTube livestream candidate ${candidateId}: ${error.message}`
      );
    }
  }

  return null;
}

export function getCachedActiveLivestreamId() {
  if (!lastKnownLivestreamId) {
    return null;
  }

  if (Date.now() - lastKnownLivestreamAt > LIVESTREAM_CACHE_TTL_MS) {
    clearRememberedLivestreamId();
    return null;
  }

  return lastKnownLivestreamId;
}

export function getCurrentLiveChatInstance() {
  return liveChatInstance;
}

function clearReconnectTimer() {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
}

function scheduleReconnect(reason, delayMs = CONNECTION_RETRY_DELAY_MS) {
  if (!keepConnectionLoopRunning) {
    return;
  }

  clearReconnectTimer();
  Logger.log(`${reason}. Retrying YouTube chat connection in ${Math.floor(delayMs / 1000)}s...`);

  reconnectTimeoutId = setTimeout(() => {
    reconnectTimeoutId = null;
    void connectToLiveChat();
  }, delayMs);
}

function stopCurrentLiveChat() {
  if (!liveChatInstance) {
    return;
  }

  try {
    liveChatInstance.stop();
  } catch (error) {
    Logger.warn(`Error while stopping YouTube live chat instance: ${error.message}`);
  }

  liveChatInstance = null;
}

/**
 * Gets the active livestream video ID from a channel
 */
export async function getActiveLivestreamId(yt, channelId) {
  const channel = await yt.getChannel(channelId);

  if (!channel.has_live_streams) {
    Logger.warn('Channel has no live streams tab');
    return null;
  }

  const liveStreamsTab = await channel.getLiveStreams();
  const videos = liveStreamsTab?.videos || [];

  // Only look for active live streams or upcoming streams, ignore past streams
  const activeStream = videos.find((video) => video?.is_live || video?.is_upcoming);

  let livestreamId = activeStream?.video_id || activeStream?.id;

  if (!livestreamId) {
    const candidateIds = collectLivestreamCandidateIds(liveStreamsTab);

    livestreamId = await resolveLivestreamIdFromCandidates(yt, candidateIds);
  }

  if (livestreamId) {
    rememberLivestreamId(livestreamId);
    Logger.log(`Found active livestream video ID: ${livestreamId}`);
    return livestreamId;
  }

  Logger.warn('No active livestream found in channel');
  return getCachedActiveLivestreamId();
}

async function getLiveChatConnection(channelId) {
  return await withYoutubeRetry('broadcaster', 'connect live chat', async (yt) => {
    const livestreamId = await getActiveLivestreamId(yt, channelId);

    console.log('getLiveChatConnection - livestreamId:', livestreamId);

    if (!livestreamId) {
      return { livestreamId: null, liveChat: null };
    }

    const response = await yt.getInfo(livestreamId);
    return {
      livestreamId,
      liveChat: response.getLiveChat()
    };
  });
}

function handleConnectError(error) {
  if (isYoutubeReauthRequiredError(error)) {
    keepConnectionLoopRunning = false;
    Logger.error(`YouTube chat requires re-authentication: ${error.message}`);
    return;
  }

  Logger.error(`Error fetching YouTube chat messages: ${error.message}`);
  stopCurrentLiveChat();
  scheduleReconnect('Failed to connect to YouTube live chat');
}

async function connectToLiveChat() {
  if (!keepConnectionLoopRunning || isConnecting) {
    return;
  }

  try {
    isConnecting = true;

    const youtubeConfig = youtubeAccountsConfig.get('');
    const channelId = youtubeConfig?.broadcaster?.id;
    const cookies = youtubeConfig?.broadcaster?.cookies;

    if (!cookies) {
      Logger.error(
        'No cookies found for YouTube broadcaster account. Cannot fetch live chat messages.'
      );
      keepConnectionLoopRunning = false;
      return;
    }

    if (!channelId) {
      Logger.error(
        'No channel ID found for YouTube broadcaster account. Cannot fetch live chat messages.'
      );
      keepConnectionLoopRunning = false;
      return;
    }

    const { livestreamId, liveChat: nextLiveChatInstance } = await getLiveChatConnection(channelId);

    if (!livestreamId) {
      scheduleReconnect('No active or upcoming YouTube livestream found', NO_STREAM_RETRY_DELAY_MS);
      return;
    }

    if (!nextLiveChatInstance) {
      scheduleReconnect('YouTube livestream found, but live chat is not available yet');
      return;
    }

    stopCurrentLiveChat();
    liveChatInstance = nextLiveChatInstance;

    liveChatInstance.on('start', () => {
      Logger.log('YouTube live chat started, now listening for messages...');
    });

    liveChatInstance.on('chat-update', async (chatItem) => {
      try {
        await handleChatMessage(chatItem);
      } catch (error) {
        Logger.error(`Error processing YouTube chat message: ${error.message}`);
      }
    });

    liveChatInstance.on('error', (error) => {
      Logger.error(`YouTube chat connection error: ${error.message}`);
      stopCurrentLiveChat();
      scheduleReconnect('YouTube chat connection dropped unexpectedly');
    });

    liveChatInstance.on('end', () => {
      Logger.log('YouTube livestream ended or chat disconnected');
      stopCurrentLiveChat();
      scheduleReconnect('YouTube chat ended');
    });

    liveChatInstance.start();
  } catch (error) {
    handleConnectError(error);
  } finally {
    isConnecting = false;
  }
}

export async function fetchLiveChatMessages() {
  if (keepConnectionLoopRunning) {
    Logger.log('YouTube chat connection loop is already running');
    return;
  }

  keepConnectionLoopRunning = true;
  clearReconnectTimer();
  Logger.log('Starting YouTube chat connection loop');
  await connectToLiveChat();
}

export function stopYouTubeChatPolling() {
  keepConnectionLoopRunning = false;
  clearReconnectTimer();
  stopCurrentLiveChat();
  clearRememberedLivestreamId();
  Logger.log('Stopped YouTube live chat polling');
  return { success: true, data: { message: 'YouTube chat polling stopped' }, error: null };
}
