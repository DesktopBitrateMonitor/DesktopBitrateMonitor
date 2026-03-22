import Logger from '../logging/logger';
import { getSrtListenerMediaSources, getStreamState } from '../streaming-software/obs-api';
import { switcherService } from '../switcher-service';
import { injectDefaults } from '../store/defaults';

let fetchInterval = null;
const fetchingTimeout = 1000;
let isPolling = false;
let lastWatcherSignature = null;
let sourcePlaybackState = new Map();
let uptime = 0;
let signalStartTimestamp = null;

function getSourceStateKey(source) {
  return `${source.sceneName}|${source.sourceName}|${source.matchedUrls.join('|')}`;
}

function cleanupSourcePlaybackState(sources) {
  const activeKeys = new Set(sources.map((source) => getSourceStateKey(source)));

  for (const key of sourcePlaybackState.keys()) {
    if (!activeKeys.has(key)) {
      sourcePlaybackState.delete(key);
    }
  }
}

function resolveSourceSignal(source) {
  const key = getSourceStateKey(source);
  const previous = sourcePlaybackState.get(key);
  const mediaCursor = typeof source.mediaCursor === 'number' ? source.mediaCursor : null;
  const stateSuggestsSignal = Boolean(source.hasVideoSignal);

  // Trust OBS media state directly; cursor increments are unreliable for live sources.
  const hasVideoSignal = stateSuggestsSignal;

  console.log(stateSuggestsSignal, previous, mediaCursor);

  sourcePlaybackState.set(key, {
    mediaCursor,
    mediaState: source.mediaState
  });

  return {
    ...source,
    stateHasVideoSignal: stateSuggestsSignal,
    hasVideoSignal
  };
}

function buildWatcherSignature(sceneName, sources) {
  return JSON.stringify({
    sceneName,
    sources: sources.map((source) => ({
      sourceName: source.sourceName,
      mediaState: source.mediaState,
      hasVideoSignal: source.hasVideoSignal,
      matchedUrls: source.matchedUrls
    }))
  });
}

function logWatcherState(sceneName, sources) {
  if (sources.length === 0) {
    Logger.info(`Listener Caller: no SRT listener media sources found in scene ${sceneName}.`);
    return;
  }

  const withSignal = sources.filter((source) => source.hasVideoSignal);
  const withoutSignal = sources.filter((source) => !source.hasVideoSignal);

  if (withSignal.length > 0) {
    const names = withSignal.map((source) => source.sourceName).join(', ');
    Logger.success(
      `Listener Caller: video signal detected on ${withSignal.length}/${sources.length} source(s) in scene ${sceneName}: ${names}`
    );
  }

  if (withoutSignal.length > 0) {
    const details = withoutSignal
      .map((source) => `${source.sourceName} (${source.mediaState})`)
      .join(', ');
    Logger.info(`Listener Caller: no video signal on ${details}`);

    // // Return fake data to trigger the switcher to switch to offline scene
    // uptime = 0;
  }
}

function buildDummyResponse(hasVideoSignal) {
  if (hasVideoSignal) {
    if (signalStartTimestamp === null) {
      signalStartTimestamp = Date.now();
    }

    uptime = Math.floor((Date.now() - signalStartTimestamp) / 1000);
  } else {
    signalStartTimestamp = null;
    uptime = 0;
  }

  return {
    success: true,
    data: {
      bitrate: hasVideoSignal ? 9999 : 0,
      rtt: hasVideoSignal ? 99 : 0,
      uptime
    },
    error: null
  };
}

export async function startListenerCallerWatcher(
  watcherActive = false,
  broadcastingSoftware = null,
  mainWindow = null
) {
  clearInterval(fetchInterval);
  fetchInterval = null;
  lastWatcherSignature = null;
  sourcePlaybackState = new Map();

  if (!watcherActive) return;

  if (!broadcastingSoftware) {
    Logger.error('No broadcasting software specified for Listener Caller watcher.');
    return;
  }

  if (broadcastingSoftware !== 'obs-studio') {
    Logger.error(`Listener Caller watcher does not support ${broadcastingSoftware}.`);
    return;
  }

  const watchAndUpdate = async () => {
    if (isPolling) {
      return;
    }

    if (broadcastingSoftware === 'obs-studio') {
      const res = await getStreamState();
      if (!res.success) {
        Logger.error(`Failed to get stream state from OBS: ${res.error}`);
        return;
      }
    }

    isPolling = true;

    try {
      const { switcherConfig } = injectDefaults();
      const liveScene = switcherConfig.get('sceneLive');

      if (!liveScene) {
        Logger.error('Listener Caller watcher requires a configured live scene.');
        return;
      }

      const mediaSources = await getSrtListenerMediaSources(liveScene);

      console.log(mediaSources);

      if (!mediaSources.success) {
        Logger.error(
          `Failed to inspect media sources in scene ${liveScene}: ${mediaSources.error}`
        );
        return buildDummyResponse(false);
      }

      const resolvedSources = mediaSources.data.map(resolveSourceSignal);
      cleanupSourcePlaybackState(resolvedSources);

      const signature = buildWatcherSignature(liveScene, resolvedSources);
      if (signature !== lastWatcherSignature) {
        logWatcherState(liveScene, resolvedSources);
        lastWatcherSignature = signature;
      }

      const hasVideoSignal = resolvedSources.some((source) => source.hasVideoSignal);
      const dummyResponse = buildDummyResponse(hasVideoSignal);

      console.log(hasVideoSignal);
      console.log(resolvedSources);
      console.log(dummyResponse.data);

      await switcherService(dummyResponse, mainWindow);

      return dummyResponse;

      // mainWindow?.webContents.send('listener-caller-state', {
      //   success: true,
      //   sceneName: liveScene,
      //   hasMatchingSource: resolvedSources.length > 0,
      //   hasVideoSignal: resolvedSources.some((source) => source.hasVideoSignal),
      //   sources: resolvedSources
      // });
    } finally {
      isPolling = false;
    }
  };

  await watchAndUpdate();
  fetchInterval = setInterval(() => {
    void watchAndUpdate();
  }, fetchingTimeout);

  return { success: true, data: { pollingMs: fetchingTimeout }, error: null };
}

export function stopWatcher() {
  clearInterval(fetchInterval);
  fetchInterval = null;
  isPolling = false;
  lastWatcherSignature = null;
  sourcePlaybackState = new Map();
  signalStartTimestamp = null;
  uptime = 0;
}
