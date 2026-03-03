import { injectDefaults } from '../store/defaults';
import Logger from '../logging/logger';
import {
  getCurrentScene,
  getSceneList,
  getStreamState,
  refreshMediaSources,
  setCurrentProgramScene
} from '../streaming-software/obs-api';
import { twitchMessageService } from '../twitch/message-service/chat-messages';

// TODO: Implement different streaming software support

const isDev = import.meta.env.DEV;

// Track pending timeouts per transition so delays are consistent even if this
// service is called at irregular intervals.
const pending = {
  offline: null,
  low: null,
  live: null
};

let counters = {
  changesToOffline: 0,
  changesToLow: 0,
  changesToLive: 0
};

// Cache the last bitrate band so we can short-circuit duplicate work when
// metrics stream in quickly without meaningfully changing state.
let lastBand = null;

// Cache stream state briefly to reduce repeated OBS queries during noisy updates.
const streamStateCache = {
  value: null,
  ts: 0,
  ttlMs: 500
};

const { appConfig, switcherConfig, streamingSoftwareConfig } = injectDefaults();

// Hysteresis helper so we don't bounce bands when rTrigger > trigger.
const computeBand = (bitrate, t, previous) => {
  if (bitrate <= t.offTrigger) return 'offline';

  // If we were live, only drop to low when back under trigger.
  if (previous === 'live') {
    return bitrate < t.trigger ? 'low' : 'live';
  }

  // If we were low or offline, only promote to live when hitting the recover trigger.
  if (bitrate >= t.rTrigger) return 'live';

  // Between trigger and rTrigger we stay where we were (defaults to low on first run).
  if (bitrate < t.trigger) return 'low';

  return previous ?? 'low';
};

export async function switcherService(data, mainWindow = null) {
  if (!data || !data.data) return;

  const { bitrate, speed, uptime } = data.data;
  const switcherSettings = switcherConfig.get('');
  const appSettings = appConfig.get('');

  const platform = appSettings.activePlatform;

  const vars = {
    switcherEnabled: switcherSettings.switcherEnabled,
    onlySwitchWhenLive: switcherSettings.onlySwitchWhenLive,
    enableChatNotifications: switcherSettings.enableChatNotifications
  };

  const scenes = [
    switcherSettings.sceneStart,
    switcherSettings.sceneLive,
    switcherSettings.sceneOffline,
    switcherSettings.sceneLow,
    switcherSettings.scenePrivacy
  ];

  const triggers = {
    trigger: switcherSettings.trigger,
    rTrigger: switcherSettings.rTrigger,
    offTrigger: switcherSettings.offTrigger
  };

  const delays = {
    toLive: switcherSettings.triggerToLive,
    toLow: switcherSettings.triggerToLow,
    toOffline: switcherSettings.triggerToOffline
  };

  const band = computeBand(bitrate, triggers, lastBand);

  // If the bitrate band hasn't changed since the last tick, skip OBS calls to
  // avoid spamming the API when telemetry is noisy but stable.

  // Commenting out the band check to allow repeated switches even in the same band.
  if (band === lastBand) {
    return;
  }

  lastBand = band;

  // If switcher is disabled, exit the switcher
  if (!vars.switcherEnabled) {
    Logger.log('Switcher is disabled.');
    return;
  }

  const streamState = await checkStreamState();

  if (isDev) {
    console.log('Data: ', data);
    console.log('Switcher Settings:', switcherSettings);
  }

  // If unable to get stream state, exit the switcher
  if (!streamState.success) {
    Logger.log('Unable to get stream state from streaming software.');
    return;
  }

  // If only switch when live is enabled, and stream is not live, exit the switcher
  if (vars.onlySwitchWhenLive && !streamState?.data?.outputActive) {
    Logger.log('Streamer is not live. Switcher is inactive.');
    return;
  }

  const currentScene = await getCurrentScene();

  // If the current scene if the privacy scene, do not switch
  if (currentScene.data === switcherSettings.scenePrivacy) {
    Logger.log('Current scene is privacy scene. Switcher is inactive.');
    return;
  }

  // Only switch if OBS is in a switchable scene
  if (!scenes.includes(currentScene.data)) {
    Logger.log('Current scene is not in switchable scenes. Switcher is inactive.');
    return;
  }

  const clearPending = (key) => {
    if (pending[key]) {
      clearTimeout(pending[key]);
      pending[key] = null;
    }
  };

  const scheduleSwitch = (key, delaySeconds, targetScene) => {
    if (pending[key]) return; // already counting down

    pending[key] = setTimeout(
      async () => {
        pending[key] = null;

        const latestScene = await getCurrentScene();
        if (latestScene.data === targetScene) return;
        if (latestScene.data === switcherSettings.scenePrivacy) return;

        const res = await setCurrentProgramScene(targetScene);
        if (!res.success) {
          Logger.error(`Failed to switch to ${targetScene} scene`);
          return;
        }

        if (key === 'live') {
          const refRes = await refreshMediaSources();
          if (!refRes.success) {
            Logger.error('Failed to refresh media sources after switching to live scene');
          }
        }

        const counterKey =
          key === 'offline' ? 'changesToOffline' : key === 'low' ? 'changesToLow' : 'changesToLive';
        counters[counterKey] += 1;
        mainWindow?.webContents.send('switcher-counter-update', counters);

        if (vars.enableChatNotifications) {
          Logger.log(`Switched to ${key.toUpperCase()} scene`);

          if (platform === 'twitch') {
            await twitchMessageService({
              action: 'switchScene',
              event: 'success',
              variables: { scene: targetScene }
            });
            Logger.log(`Automatic switch to scene ${key}`);
          }

          // Schedule chat notification here (after successful switch)
        }
      },
      Number(delaySeconds) * 1000
    );
  };

  if (currentScene.data !== switcherSettings.sceneStart && bitrate <= triggers.offTrigger) {
    scheduleSwitch('offline', delays.toOffline, switcherSettings.sceneOffline);
    clearPending('low');
    clearPending('live');
    return;
  }
  clearPending('offline');

  if (currentScene.data !== switcherSettings.sceneStart && bitrate < triggers.trigger) {
    scheduleSwitch('low', delays.toLow, switcherSettings.sceneLow);
    clearPending('offline');
    clearPending('live');
    return;
  }
  clearPending('low');

  if (bitrate >= triggers.rTrigger) {
    scheduleSwitch('live', delays.toLive, switcherSettings.sceneLive);
    clearPending('offline');
    clearPending('low');
    return;
  }
  clearPending('live');
}

const checkStreamState = async () => {
  const softwareSettings = streamingSoftwareConfig.get('');

  const currentSoftware = softwareSettings.currentType;
  let streamState = false;

  // Use a short-lived cache to avoid hammering OBS when data updates are very frequent.
  const now = Date.now();
  if (now - streamStateCache.ts < streamStateCache.ttlMs && streamStateCache.value) {
    return streamStateCache.value;
  }

  if (currentSoftware === 'obs-studio') {
    streamState = await getStreamState();
  }
  streamStateCache.value = streamState;
  streamStateCache.ts = now;

  return streamState;
};
