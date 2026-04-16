import { OBSWebSocket } from 'obs-websocket-js';
import { injectDefaults } from '../store/defaults';
import Logger from '../logging/logger';

let obs;
let isConnected = false;
let reconnectLoop = false;
let reconnectAttempt = 0;
let reconnectDelaySeconds = 5;

const MAX_RECONNECT_DELAY_SECONDS = 120;

function getNextReconnectDelaySeconds(currentDelaySeconds) {
  if (currentDelaySeconds < 20) {
    return Math.min(currentDelaySeconds + 5, MAX_RECONNECT_DELAY_SECONDS);
  }

  return Math.min(currentDelaySeconds + 10, MAX_RECONNECT_DELAY_SECONDS);
}

function getOBSInstance(mainWindow = null) {
  if (!obs) {
    obs = new OBSWebSocket();

    obs.on('ConnectionClosed', () => {
      isConnected = false;
      Logger.info('OBS Studio connection closed');
      mainWindow?.webContents.send('software-connection', {
        success: false,
        status: 'disconnected',
        softwareType: 'undefined',
        data: null,
        error: null
      });
    });

    obs.on('ConnectionOpened', () => {
      isConnected = true;
      Logger.log('Connected to OBS Studio');
      mainWindow?.webContents.send('software-connection', {
        success: true,
        status: 'connected',
        softwareType: 'obs-studio',
        data: null,
        error: null
      });
    });

    obs.on('StreamStateChanged', (data) => {
      mainWindow?.webContents.send('software-connection', {
        success: true,
        status: isConnected ? 'connected' : 'disconnected',
        softwareType: 'obs-studio',
        data: data,
        error: null
      });
    });
  }
  return obs;
}

export async function startOBSConnectionLoop(mainWindow = null) {
  if (reconnectLoop) return;
  reconnectLoop = true;
  reconnectAttempt = 0;
  reconnectDelaySeconds = 5;

  const scheduleNextReconnect = (attemptReconnect) => {
    const delaySeconds = reconnectDelaySeconds;
    setTimeout(attemptReconnect, delaySeconds * 1000);
    reconnectDelaySeconds = getNextReconnectDelaySeconds(reconnectDelaySeconds);
  };

  const attemptReconnect = async () => {
    if (!isConnected) {
      reconnectAttempt += 1;
      try {
        const res = await connectToOBS(mainWindow);
        if (res.success) {
          Logger.log('Connected to OBS Studio successfully.');

          // Check stream state immediately after connecting to update the broadcast state in the frontend
          const streamState = await getStreamState();
          const outputActive = streamState?.data?.outputActive ?? false;

          mainWindow?.webContents.send('software-connection', {
            success: true,
            status: 'connected',
            softwareType: 'obs-studio',
            data: { outputActive },
            error: null
          });

          reconnectAttempt = 0;
          reconnectDelaySeconds = 5;
          reconnectLoop = false;
          return { success: true, data: null, error: null };
        }
      } catch (err) {
        Logger.error(`Connect attempt failed: ${err}`);
        mainWindow?.webContents.send('software-connection', { success: false });
        return { success: false, data: null, error: err };
      }

      Logger.info(
        `Connection try #${reconnectAttempt} failed. Next try in ${reconnectDelaySeconds} seconds.`
      );
      scheduleNextReconnect(attemptReconnect);
    } else {
      reconnectAttempt = 0;
      reconnectDelaySeconds = 5;
      reconnectLoop = false;
    }
  };

  scheduleNextReconnect(attemptReconnect);
}

export async function connectToOBS(mainWindow = null) {
  const { streamingSoftwareConfig } = injectDefaults();
  const obsConfig = streamingSoftwareConfig.get('obs-studio');

  const address = `ws://${obsConfig.host}:${obsConfig.port}`;
  const password = obsConfig.password;

  const obsInstance = getOBSInstance(mainWindow);

  obsInstance.on('ConnectionClosed', () => {
    isConnected = false;
    Logger.info('OBS Studio connection closed');
    startOBSConnectionLoop(mainWindow);
  });

  try {
    await obsInstance.connect(address, password);
    Logger.log('Connected to OBS Studio');
    isConnected = true;
    return { success: true, data: null, error: null };
  } catch (error) {
    obs = null;
    isConnected = false;
    Logger.error(`Failed to connect to OBS Studio: ${error}`);
    return { success: false, data: null, error: error };
  }
}

export async function disconnectFromOBS(mainWindow = null) {
  if (obs) {
    try {
      await obs.disconnect();
      obs = null;
      isConnected = false;
      Logger.log('Disconnected from OBS Studio');
    } catch (err) {
      Logger.error(`Failed to disconnect from OBS Studio: ${err}`);
    }
  }
}

export async function reconnectToOBS(mainWindow = null) {
  if (obs) {
    await disconnectFromOBS(mainWindow);
  }
  const res = await connectToOBS(mainWindow);
  return res;
}

export async function getStreamState() {
  try {
    const data = await obs.call('GetStreamStatus');
    return { data: data, success: true, error: null };
  } catch (error) {
    return { data: null, success: false, error: error };
  }
}

export async function getCurrentScene() {
  try {
    const scenes = await obs.call('GetSceneList');
    return { success: true, data: scenes.currentProgramSceneName, error: null };
  } catch (error) {
    return { success: false, data: null, error: error };
  }
}

export async function getSceneList() {
  try {
    const scenes = await obs.call('GetSceneList');
    return { success: true, data: scenes, error: null };
  } catch (error) {
    return { success: false, data: null, error: error };
  }
}

export async function startStream() {
  try {
    const { data } = await getStreamState();
    if (data?.outputActive) {
      return { success: false, data: null, error: null };
    }
    await obs.call('StartStream');
    return { success: true, data: null, error: null };
  } catch (error) {
    Logger.error('Stream start failed');
    return { success: false, data: null, error: error };
  }
}

export async function stopStream() {
  try {
    const { data } = await getStreamState();
    if (!data) {
      Logger.error('OBS returns null');
      return { success: false, data: null, error: null };
    }
    if (!data.outputActive) {
      Logger.info(`Stream isn't running`);
      return { success: false, data: null, error: null };
    }

    await obs.call('StopStream');
    Logger.success('Stream successfully stopped');
    return { success: true, data: null, error: null };
  } catch (error) {
    Logger.error(`Failed to stop stream: ${error}`);
    return { success: false, data: null, error: error };
  }
}

export async function setCurrentProgramScene(scene) {
  try {
    const scenes = await obs.call('GetSceneList');
    let sceneExists = false;
    let sceneToSwitch;
    scenes.scenes.forEach((o) => {
      if (o.sceneName.toLowerCase() === scene.toLowerCase()) {
        sceneExists = true;
        sceneToSwitch = o.sceneName;
      }
    });
    if (sceneExists) {
      await obs.call('SetCurrentProgramScene', { sceneName: sceneToSwitch });
      Logger.success(`Successfully switched to scene ${sceneToSwitch}`);
      return { success: true, data: null, error: null };
    } else {
      Logger.error(`Unable to switch to scene ${sceneToSwitch}`);
      return { success: false, data: null, error: null };
    }
  } catch (error) {
    Logger.error(`Scene switch failed`);
    return { success: false, data: null, error: error };
  }
}

let isRefreshing = false;

export async function fixMediaSources() {
  if (isRefreshing) {
    Logger.error('Refreshing is already running...');
    return { success: false, data: null, error: null };
  }

  isRefreshing = true;

  try {
    const currentScene = await obs.call('GetCurrentProgramScene');

    // Collect active media inputs (ffmpeg/vlc) from the current scene and nested scenes/groups
    const visited = new Set();
    const sources = await collectMediaSources(currentScene.currentProgramSceneName, visited, false);

    let refreshed = 0;
    for (const source of sources) {
      // Refresh by reapplying empty settings, forcing OBS to reopen the input

      // Get current settings to preserve them during the refresh
      const settingsResp = await obs.call('GetInputSettings', {
        inputName: source.sourceName
      });

      try {
        await obs.call('SetInputSettings', {
          inputName: source.sourceName,
          inputSettings: settingsResp.inputSettings,
          overlay: false
        });
        refreshed += 1;
      } catch (err) {
        Logger.error(`Failed to refresh media source ${source.sourceName}: ${err}`);
      }
    }

    Logger.success(`Refreshed ${refreshed} media source(s)`);
    return { success: true, data: { refreshed }, error: null };
  } catch (error) {
    Logger.error('Refreshing media sources failed');
    return { success: false, data: null, error };
  } finally {
    isRefreshing = false;
  }
}

export async function getSceneItemList(scene) {
  try {
    const items = await obs.call('GetSceneItemList', {
      sceneName: scene
    });
    return { success: true, data: items, error: null };
  } catch (error) {
    Logger.error(`Error getting scene item list: ${error.message}`);
    return { success: false, data: null, error: error };
  }
}

export async function getInputSettings(sourceName) {
  try {
    const inputSettings = await obs.call('GetInputSettings', {
      inputName: sourceName
    });
    return { success: true, data: inputSettings, error: null };
  } catch (error) {
    Logger.error(`Error getting input settings: ${error.message}`);
    return { success: false, data: null, error: error };
  }
}

export async function getCurrentProgramScene() {
  try {
    const scenes = await obs.call('GetCurrentProgramScene');
    return { success: true, data: scenes, error: null };
  } catch (error) {
    Logger.error(`Error getting current program scene: ${error.message}`);
    return { success: false, data: null, error: error };
  }
}

async function collectMediaSources(sceneName, visited, isGroup) {
  const key = `${isGroup ? 'group' : 'scene'}:${sceneName}`.toLowerCase();
  if (visited.has(key)) return [];
  visited.add(key);

  const request = isGroup ? 'GetGroupSceneItemList' : 'GetSceneItemList';
  const items = await obs.call(request, { sceneName });

  const results = [];

  for (const item of items.sceneItems) {
    if (item?.sceneItemEnabled !== true) {
      continue;
    }

    // Recurse into nested scenes or groups
    if (item.sourceType === 'OBS_SOURCE_TYPE_SCENE') {
      const nested = await collectMediaSources(item.sourceName, visited, false);
      results.push(...nested);
      continue;
    }

    if (item.sourceType === 'OBS_SOURCE_TYPE_GROUP') {
      const nested = await collectMediaSources(item.sourceName, visited, true);
      results.push(...nested);
      continue;
    }

    if (
      !item.inputKind ||
      (item.inputKind !== 'ffmpeg_source' && item.inputKind !== 'vlc_source')
    ) {
      continue;
    }

    // Check media state to ensure the source is active
    const status = await obs.call('GetMediaInputStatus', { inputName: item.sourceName });
    const state = status.mediaState;
    if (
      !['OBS_MEDIA_STATE_PLAYING', 'OBS_MEDIA_STATE_BUFFERING', 'OBS_MEDIA_STATE_OPENING'].includes(
        state
      )
    ) {
      continue;
    }

    // Inspect settings to confirm it is a network input
    const settingsResp = await obs.call('GetInputSettings', { inputName: item.sourceName });
    const settings = settingsResp.inputSettings || {};

    const urls = [];
    if (item.inputKind === 'ffmpeg_source' && typeof settings.input === 'string') {
      urls.push(settings.input.toLowerCase());
    }
    if (item.inputKind === 'vlc_source' && Array.isArray(settings.playlist)) {
      for (const entry of settings.playlist) {
        if (entry?.value) {
          urls.push(String(entry.value).toLowerCase());
        }
      }
    }

    const isNetwork = urls.some(
      (u) =>
        u.startsWith('rtmp') ||
        u.startsWith('srt') ||
        u.startsWith('udp') ||
        u.startsWith('rist') ||
        u.startsWith('rtsp')
    );

    if (!isNetwork) {
      continue;
    }

    results.push({
      sceneName,
      sourceName: item.sourceName,
      inputKind: item.inputKind
    });
  }

  return results;
}
