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

// Separate logical switcher state from OBS scene names.
// Prevents ambiguity when low/offline use the same scene.
let logicalSwitcherState = null;
let lastDesiredState = null;
let sameDesiredCount = 0;

// Cache stream state briefly to reduce repeated OBS queries during noisy updates.
const streamStateCache = {
  value: null,
  ts: 0,
  ttlMs: 500
};

const {
  appConfig,
  switcherConfig,
  streamingSoftwareConfig,
  serverConfig,
  twitchAccountsConfig,
  kickAccountsConfig
} = injectDefaults();

const normalizeInstancesStats = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.instancesStats)) return payload.instancesStats;
  if (Array.isArray(payload?.data)) return payload.data;
  // if (payload?.data && typeof payload.data === 'object') {
  //   // Backward compatibility: single instance payload shape
  //   return [
  //     {
  //       success: Boolean(payload?.success),
  //       data: payload.data,
  //       instance: null,
  //       fetchingInterval: payload?.fetchingInterval
  //     }
  //   ];
  // }
  return [];
};

const getBitrate = (entry) => Number(entry?.data?.bitrate) || 0;

const deriveLogicalStateFromScene = (sceneName, settings, previous) => {
  const start = settings.sceneStart.toLowerCase();
  const live = settings.sceneLive.toLowerCase();
  const low = settings.sceneLow.toLowerCase();
  const offline = settings.sceneOffline.toLowerCase();

  if (sceneName === start) return 'start';
  if (sceneName === live) return 'live';

  // If low/offline share the same scene name, preserve previous logical state.
  if (low === offline) {
    if (sceneName === low) return previous ?? 'offline';
  } else {
    if (sceneName === low) return 'low';
    if (sceneName === offline) return 'offline';
  }

  return previous ?? 'offline';
};

const computeDesiredState = (instancesStats, t, currentLogicalState) => {
  if (!instancesStats.length) {
    return {
      desiredState: 'offline',
      anyAboveTrigger: false,
      allAtOrBelowTrigger: true,
      allAtOrBelowOffTrigger: true,
      topAboveRecover: false
    };
  }

  const bitrates = instancesStats.map(getBitrate);
  const topBitrate = bitrates[0] ?? 0;
  const anyAboveTrigger = bitrates.some((b) => b > t.trigger);
  const allAtOrBelowTrigger = bitrates.every((b) => b <= t.trigger);
  const allAtOrBelowOffTrigger = bitrates.every((b) => b <= t.offTrigger);
  const topAboveRecover = topBitrate >= t.rTrigger;

  // Highest priority: offline
  if (allAtOrBelowOffTrigger) {
    return {
      desiredState: 'offline',
      anyAboveTrigger,
      allAtOrBelowTrigger,
      allAtOrBelowOffTrigger,
      topAboveRecover
    };
  }

  // Start/offline -> live if any stream exceeds trigger
  if (currentLogicalState === 'start' || currentLogicalState === 'offline') {
    if (anyAboveTrigger) {
      return {
        desiredState: 'live',
        anyAboveTrigger,
        allAtOrBelowTrigger,
        allAtOrBelowOffTrigger,
        topAboveRecover
      };
    }
    // Between offTrigger and trigger, remain low-like holding state
    return {
      desiredState: 'low',
      anyAboveTrigger,
      allAtOrBelowTrigger,
      allAtOrBelowOffTrigger,
      topAboveRecover
    };
  }

  // Low -> live only when top priority stream reaches recover trigger
  if (currentLogicalState === 'low') {
    if (topAboveRecover) {
      return {
        desiredState: 'live',
        anyAboveTrigger,
        allAtOrBelowTrigger,
        allAtOrBelowOffTrigger,
        topAboveRecover
      };
    }
    return {
      desiredState: 'low',
      anyAboveTrigger,
      allAtOrBelowTrigger,
      allAtOrBelowOffTrigger,
      topAboveRecover
    };
  }

  // Live -> low when all streams at/below trigger
  if (currentLogicalState === 'live') {
    if (allAtOrBelowTrigger) {
      return {
        desiredState: 'low',
        anyAboveTrigger,
        allAtOrBelowTrigger,
        allAtOrBelowOffTrigger,
        topAboveRecover
      };
    }
    return {
      desiredState: 'live',
      anyAboveTrigger,
      allAtOrBelowTrigger,
      allAtOrBelowOffTrigger,
      topAboveRecover
    };
  }

  // Fallback
  return {
    desiredState: anyAboveTrigger ? 'live' : 'low',
    anyAboveTrigger,
    allAtOrBelowTrigger,
    allAtOrBelowOffTrigger,
    topAboveRecover
  };
};

export async function switcherService(data, mainWindow = null) {
  const instancesStats = normalizeInstancesStats(data);
  if (instancesStats.length === 0) return;

  const switcherSettings = switcherConfig.get('');
  const serverSettings = serverConfig.get('');
  const serverName = serverSettings.serverInstances?.[0]?.name || 'undefined';
  const appSettings = appConfig.get('');
  const twitchAccountsSettings = twitchAccountsConfig.get('');
  const kickAccountsSettings = kickAccountsConfig.get('');

  const ACCOUNTS_MAPPING = {
    twitch: twitchAccountsSettings,
    kick: kickAccountsSettings
  };

  const platform = appSettings.activePlatform;
  const broadcasterToken = ACCOUNTS_MAPPING[platform]['broadcaster'].access_token;
  const tokenAvailable = Boolean(broadcasterToken);

  const vars = {
    switcherEnabled: switcherSettings.switcherEnabled,
    onlySwitchWhenLive: switcherSettings.onlySwitchWhenLive,
    enableChatNotifications: switcherSettings.enableChatNotifications,
    switchFromStartingToLive: switcherSettings.switchFromStartingToLive
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

  const retryAttempts = 1;

  // If triggerToLive is 0, allow instant offline -> live recovery.
  const allowInstantRecover = Number(delays.toLive) === 0;

  // If switcher is disabled, exit the switcher
  if (!vars.switcherEnabled) {
    Logger.log('Switcher is disabled.');
    return;
  }

  const streamState = await checkStreamState();

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
  const currentSceneName = currentScene.data.toLowerCase();

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

  // If the current scene is the privacy scene, do not switch.
  if (currentSceneName === switcherSettings.scenePrivacy.toLowerCase()) {
    Logger.log('Current scene is privacy scene. Switcher is inactive.');
    clearAllPending();
    return;
  }

  // If current scene is not switchable, stop here.
  if (!scenes.includes(currentSceneName)) {
    clearAllPending();
    Logger.log('Current scene is not in switchable scenes. Switcher is inactive.');
    return;
  }

  // Keep logical state independent from scene-name collisions.
  logicalSwitcherState = deriveLogicalStateFromScene(
    currentSceneName,
    switcherSettings,
    logicalSwitcherState
  );

  const { desiredState } = computeDesiredState(instancesStats, triggers, logicalSwitcherState);

  if (desiredState === lastDesiredState) {
    sameDesiredCount += 1;
  } else {
    sameDesiredCount = 0;
    lastDesiredState = desiredState;
  }

  const forceInstantRecover =
    allowInstantRecover && logicalSwitcherState === 'offline' && desiredState === 'live';

  if (!forceInstantRecover && sameDesiredCount < retryAttempts) {
    return;
  }

  const scheduleSwitch = (key, delaySeconds, targetScene) => {
    if (pending[key]) return; // already counting down

    pending[key] = setTimeout(
      async () => {
        pending[key] = null;

        const latestScene = await getCurrentScene();
        const latestSceneName = latestScene?.data?.toLowerCase();

        const isStartScene = latestSceneName === switcherSettings?.sceneStart?.toLowerCase();
        const isLiveTarget =
          targetScene?.toLowerCase() === switcherSettings?.sceneLive?.toLowerCase();
        const isPrivacyScene = latestSceneName === switcherSettings?.scenePrivacy?.toLowerCase();

        // Re-check conditions at delay end.
        if (latestSceneName === targetScene?.toLowerCase()) return;
        if (isPrivacyScene) return;
        if (!scenes.includes(latestSceneName)) return;
        if (
          isStartScene &&
          targetScene?.toLowerCase() !== switcherSettings?.sceneLive?.toLowerCase()
        )
          return;
        if (isStartScene && (!vars.switchFromStartingToLive || !isLiveTarget)) {
          return;
        }

        const res = await setCurrentProgramScene(targetScene);
        if (!res.success) {
          Logger.error('Failed to switch to ' + targetScene + ' scene');
          return;
        }

        // Update logical state on confirmed switch.
        if (key === 'offline') logicalSwitcherState = 'offline';
        if (key === 'low') logicalSwitcherState = 'low';
        if (key === 'live') logicalSwitcherState = 'live';

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
          Logger.log('Switched to ' + key.toUpperCase() + ' scene');

          if (!tokenAvailable) {
            Logger.log(
              'No broadcaster token available, skipping chat notification for switching to ' +
                key +
                ' scene'
            );
            return;
          }

          // Chat notification
          if (platform === 'twitch') {
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
            Logger.log('Automatic switch to scene ' + key);
          }
        }
      },
      Number(delaySeconds) * 1000
    );
  };

  // Respect manual hold-start setting.
  if (logicalSwitcherState === 'start' && desiredState === 'live' && !vars.switchFromStartingToLive) {
    Logger.log(
      'Currently in starting scene and automatic switch starting -> live is disabled. Switcher will not switch to live scene.'
    );
    clearAllPending();
    return;
  }

  if (desiredState === 'offline') {
    scheduleSwitch('offline', delays.toOffline, switcherSettings.sceneOffline);
    clearPending('low');
    clearPending('live');
    return;
  }
  clearPending('offline');

  if (desiredState === 'low') {
    scheduleSwitch('low', delays.toLow, switcherSettings.sceneLow);
    clearPending('offline');
    clearPending('live');
    return;
  }
  clearPending('low');

  if (desiredState === 'live') {
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
