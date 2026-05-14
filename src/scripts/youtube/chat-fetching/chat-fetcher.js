import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { handleChatMessage } from './handleChatMessage';
import { isYoutubeReauthRequiredError, withYoutubeRetry } from '../../authorization/youtube-auth';

const { youtubeAccountsConfig } = injectDefaults();

const liveChatInstances = new Map();
let reconnectTimeoutId = null;
let periodicRescanIntervalId = null;
let keepConnectionLoopRunning = false;
let isConnecting = false;
let lastKnownLivestreamId = null;
let lastKnownLivestreamAt = 0;

const NO_STREAM_RETRY_DELAY_MS = 5 * 1000;
const CONNECTION_RETRY_DELAY_MS = 5 * 1000;
const PERIODIC_RESCAN_INTERVAL_MS = 60 * 1000;
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

async function resolveLivestreamIdsFromCandidates(yt, candidateIds, seenIds = new Set()) {
  const livestreamIds = [];

  for (const candidateId of candidateIds) {
    if (seenIds.has(candidateId)) {
      continue;
    }

    try {
      const response = await yt.getInfo(candidateId);
      const basicInfo = response?.basic_info || {};

      if (basicInfo?.is_live || basicInfo?.is_upcoming) {
        seenIds.add(candidateId);
        livestreamIds.push(candidateId);
      }
    } catch (error) {
      Logger.warn(
        `Failed to inspect YouTube livestream candidate ${candidateId}: ${error.message}`
      );
    }
  }

  return livestreamIds;
}

function getDirectLivestreamIds(videos) {
  const livestreamIds = [];
  const seenIds = new Set();

  for (const video of videos) {
    if (!video?.is_live && !video?.is_upcoming) {
      continue;
    }

    const livestreamId = extractVideoId(video);

    if (!livestreamId || seenIds.has(livestreamId)) {
      continue;
    }

    seenIds.add(livestreamId);
    livestreamIds.push(livestreamId);
  }

  return livestreamIds;
}

function getPreferredConnectedLiveChatInstance() {
  for (const liveChatInstance of liveChatInstances.values()) {
    if (liveChatInstance?.running) {
      return liveChatInstance;
    }
  }

  for (const liveChatInstance of liveChatInstances.values()) {
    return liveChatInstance;
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

export function getCurrentLiveChatInstance(livestreamId = null) {
  if (livestreamId) {
    return liveChatInstances.get(livestreamId) || null;
  }

  return getPreferredConnectedLiveChatInstance();
}

function clearReconnectTimer() {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
}

function startPeriodicRescanLoop() {
  if (periodicRescanIntervalId || !keepConnectionLoopRunning) {
    return;
  }

  periodicRescanIntervalId = setInterval(() => {
    if (!keepConnectionLoopRunning || isConnecting) {
      return;
    }

    void connectToLiveChat();
  }, PERIODIC_RESCAN_INTERVAL_MS);
}

function clearPeriodicRescanLoop() {
  if (periodicRescanIntervalId) {
    clearInterval(periodicRescanIntervalId);
    periodicRescanIntervalId = null;
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

function stopLiveChatInstance(livestreamId) {
  const liveChatInstance = liveChatInstances.get(livestreamId);

  if (!liveChatInstance) {
    return;
  }

  try {
    liveChatInstance.stop();
  } catch (error) {
    Logger.warn(`Error while stopping YouTube live chat instance: ${error.message}`);
  }

  liveChatInstances.delete(livestreamId);
}

function stopCurrentLiveChat() {
  for (const livestreamId of Array.from(liveChatInstances.keys())) {
    stopLiveChatInstance(livestreamId);
  }
}

/**
 * Gets the active livestream video ID from a channel
 */
export async function getActiveLivestreamIds(yt, channelId) {
  const channel = await yt.getChannel(channelId);

  if (!channel.has_live_streams) {
    Logger.warn('Channel has no live streams tab');
    const cachedLivestreamId = getCachedActiveLivestreamId();
    return cachedLivestreamId ? [cachedLivestreamId] : [];
  }

  const liveStreamsTab = await channel.getLiveStreams();
  const videos = liveStreamsTab?.videos || [];
  const livestreamIds = getDirectLivestreamIds(videos);
  const seenIds = new Set(livestreamIds);
  const candidateIds = collectLivestreamCandidateIds(liveStreamsTab);
  const resolvedLivestreamIds = await resolveLivestreamIdsFromCandidates(yt, candidateIds, seenIds);
  livestreamIds.push(...resolvedLivestreamIds);

  if (livestreamIds.length) {
    rememberLivestreamId(livestreamIds[0]);
    Logger.log(`Found active/upcoming livestream video IDs: ${livestreamIds.join(', ')}`);
    return livestreamIds;
  }

  Logger.warn('No active livestream found in channel');
  const cachedLivestreamId = getCachedActiveLivestreamId();
  return cachedLivestreamId ? [cachedLivestreamId] : [];
}

/**
 * Gets the preferred active livestream video ID from a channel
 */
export async function getActiveLivestreamId(yt, channelId) {
  const livestreamIds = await getActiveLivestreamIds(yt, channelId);
  return livestreamIds[0] || null;
}

async function getLiveChatConnections(channelId) {
  return await withYoutubeRetry('broadcaster', 'connect live chat', async (yt) => {
    const livestreamIds = await getActiveLivestreamIds(yt, channelId);

    if (!livestreamIds.length) {
      return [];
    }

    const liveChatConnections = [];

    for (const livestreamId of livestreamIds) {
      try {
        const response = await yt.getInfo(livestreamId);
        liveChatConnections.push({
          livestreamId,
          liveChat: response.getLiveChat()
        });
      } catch (error) {
        if (isYoutubeReauthRequiredError(error)) {
          throw error;
        }

        Logger.warn(`Failed to connect to YouTube live chat for ${livestreamId}: ${error.message}`);
        liveChatConnections.push({ livestreamId, liveChat: null });
      }
    }

    return liveChatConnections;
  });
}

function attachLiveChatListeners(livestreamId, liveChatInstance) {
  liveChatInstance.on('start', () => {
    Logger.log(
      `YouTube live chat started for stream ${livestreamId}, now listening for messages...`
    );
  });

  liveChatInstance.on('chat-update', async (chatItem) => {
    try {
      await handleChatMessage(chatItem, livestreamId);
    } catch (error) {
      Logger.error(`Error processing YouTube chat message: ${error.message}`);
    }
  });

  liveChatInstance.on('error', (error) => {
    Logger.error(`YouTube chat connection error for ${livestreamId}: ${error.message}`);
    stopLiveChatInstance(livestreamId);
    scheduleReconnect('YouTube chat connection dropped unexpectedly');
  });

  liveChatInstance.on('end', () => {
    Logger.log(`YouTube livestream ${livestreamId} ended or chat disconnected`);
    stopLiveChatInstance(livestreamId);
    scheduleReconnect('YouTube chat ended');
  });
}

function handleConnectError(error) {
  if (isYoutubeReauthRequiredError(error)) {
    keepConnectionLoopRunning = false;
    clearReconnectTimer();
    clearPeriodicRescanLoop();
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
      clearReconnectTimer();
      clearPeriodicRescanLoop();
      return;
    }

    if (!channelId) {
      Logger.error(
        'No channel ID found for YouTube broadcaster account. Cannot fetch live chat messages.'
      );
      keepConnectionLoopRunning = false;
      clearReconnectTimer();
      clearPeriodicRescanLoop();
      return;
    }

    const liveChatConnections = await getLiveChatConnections(channelId);

    if (!liveChatConnections.length) {
      scheduleReconnect('No active or upcoming YouTube livestream found', NO_STREAM_RETRY_DELAY_MS);
      return;
    }

    const resolvedLivestreamIds = new Set(
      liveChatConnections.map(({ livestreamId }) => livestreamId).filter(Boolean)
    );

    for (const livestreamId of Array.from(liveChatInstances.keys())) {
      if (!resolvedLivestreamIds.has(livestreamId)) {
        stopLiveChatInstance(livestreamId);
      }
    }

    let connectedChatsCount = 0;
    let unavailableChatsCount = 0;

    for (const { livestreamId, liveChat } of liveChatConnections) {
      if (!liveChat) {
        unavailableChatsCount += 1;
        continue;
      }

      const currentLiveChatInstance = liveChatInstances.get(livestreamId);

      if (currentLiveChatInstance?.running) {
        connectedChatsCount += 1;
        continue;
      }

      if (currentLiveChatInstance) {
        stopLiveChatInstance(livestreamId);
      }

      liveChatInstances.set(livestreamId, liveChat);
      attachLiveChatListeners(livestreamId, liveChat);
      liveChat.start();
      connectedChatsCount += 1;
    }

    if (!connectedChatsCount && unavailableChatsCount) {
      scheduleReconnect('YouTube livestreams found, but live chat is not available yet');
      return;
    }

    if (unavailableChatsCount) {
      scheduleReconnect('Some YouTube livestream chats are not available yet');
    }
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
  startPeriodicRescanLoop();
  Logger.log('Starting YouTube chat connection loop');
  await connectToLiveChat();
}

export function stopYouTubeChatPolling() {
  keepConnectionLoopRunning = false;
  clearReconnectTimer();
  clearPeriodicRescanLoop();
  stopCurrentLiveChat();
  clearRememberedLivestreamId();
  Logger.log('Stopped YouTube live chat polling');
  return { success: true, data: { message: 'YouTube chat polling stopped' }, error: null };
}
