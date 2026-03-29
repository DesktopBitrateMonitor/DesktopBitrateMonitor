import { injectDefaults } from '../store/defaults';
import Logger from '../logging/logger';
import {
  getCurrentScene,
  getStreamState,
  setCurrentProgramScene,
  fixMediaSources
} from '../streaming-software/obs-api';
import { twitchMessageService } from '../twitch/message-service/chat-messages';
import { kickMessageService } from '../kick/messages-service/chat-messages';

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

// Track repeated observations of the same band to avoid flapping on noisy input.
let sameBandCount = 0;

// Cache stream state briefly to reduce repeated OBS queries during noisy updates.
const streamStateCache = {
  value: null,
  ts: 0,
  ttlMs: 500
};

const { appConfig, switcherConfig, streamingSoftwareConfig, serverConfig } = injectDefaults();

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
  const serverSettings = serverConfig.get('');
  const serverType = serverSettings.currentType;
  const serverName = serverSettings[serverType].name;
  const appSettings = appConfig.get('');

  const platform = appSettings.activePlatform;

  const vars = {
    switcherEnabled: switcherSettings.switcherEnabled,
    onlySwitchWhenLive: switcherSettings.onlySwitchWhenLive,
    enableChatNotifications: switcherSettings.enableChatNotifications
  };

  const scenes = [
    switcherSettings.sceneStart.toLowerCase(),
    switcherSettings.sceneLive.toLowerCase(),
    switcherSettings.sceneOffline.toLowerCase(),
    switcherSettings.sceneLow.toLowerCase(),
    switcherSettings.scenePrivacy.toLowerCase()
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

  // Optional stability levers (safe defaults if missing in config).
  const retryAttempts = Number(switcherSettings.retryAttempts ?? 1);

  // If the offToLiveTrigger is set to 0, allow instant recovery from offline to live without requiring repeated confirmations.
  const allowInstantRecover = Number(delays.toLive) === 0;

  const band = computeBand(bitrate, triggers, lastBand);

  const prevBand = lastBand;

  if (band === lastBand) {
    sameBandCount += 1;
  } else {
    sameBandCount = 0;
    lastBand = band;
  }

  const forceInstantRecover = allowInstantRecover && prevBand === 'offline' && band === 'live';

  // Require repeated confirmation of the same band before acting, unless we are
  // explicitly recovering from offline to live.
  if (!forceInstantRecover && sameBandCount < retryAttempts) {
    return;
  }

  // If switcher is disabled, exit the switcher
  if (!vars.switcherEnabled) {
    Logger.log('Switcher is disabled.');
    return;
  }

  const streamState = await checkStreamState();

  // if (isDev) {
  //   console.log('Data: ', data);
  //   console.log('Switcher Settings:', switcherSettings);
  // }

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

  const clearPending = (key) => {
    if (pending[key]) {
      clearTimeout(pending[key]);
      pending[key] = null;
    }
  };

  const clearAllPending = () => {
    clearPending('offline');
    clearPending('low');
    clearPending('live');
  };

  // If the current scene if the privacy scene, do not switch
  if (currentScene.data.toLowerCase() === switcherSettings.scenePrivacy.toLowerCase()) {
    Logger.log('Current scene is privacy scene. Switcher is inactive.');
    clearAllPending();
    return;
  }

  // Only switch if OBS is in a switchable scene
  if (!scenes.includes(currentScene.data.toLowerCase())) {
    clearAllPending();
    Logger.log('Current scene is not in switchable scenes. Switcher is inactive.');
    return;
  }

  const scheduleSwitch = (key, delaySeconds, targetScene) => {
    if (pending[key]) return; // already counting down

    pending[key] = setTimeout(
      async () => {
        pending[key] = null;

        const latestScene = await getCurrentScene();
        if (latestScene?.data.toLowerCase() === targetScene?.toLowerCase()) return;
        if (latestScene?.data.toLowerCase() === switcherSettings?.scenePrivacy?.toLowerCase())
          return;
        if (!scenes.includes(latestScene?.data?.toLowerCase())) return;

        const res = await setCurrentProgramScene(targetScene);
        if (!res.success) {
          Logger.error(`Failed to switch to ${targetScene} scene`);
          return;
        }

        if (key === 'live') {
          const refRes = await fixMediaSources();
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

          // Send chat message on scene switch if enabled
          if (platform === 'twitch') {
            console.log(serverName);
            await twitchMessageService({
              action: 'switchScene',
              event: 'success',
              variables: { scene: targetScene, server: serverName }
            });
            Logger.log(`Automatic switch to scene ${key}`);
          }
          if (platform === 'kick') {
            await kickMessageService({
              action: 'switchScene',
              event: 'success',
              variables: { scene: targetScene, server: serverName }
            });
            Logger.log(`Automatic switch to scene ${key}`);
          }
        }
      },
      Number(delaySeconds) * 1000
    );
  };

  if (
    currentScene.data.toLowerCase() !== switcherSettings.sceneStart.toLowerCase() &&
    bitrate <= triggers.offTrigger
  ) {
    scheduleSwitch('offline', delays.toOffline, switcherSettings.sceneOffline);
    clearPending('low');
    clearPending('live');
    return;
  }
  clearPending('offline');

  if (
    currentScene.data.toLowerCase() !== switcherSettings.sceneStart.toLowerCase() &&
    bitrate < triggers.trigger
  ) {
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
