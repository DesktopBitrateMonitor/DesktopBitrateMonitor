import { OBSWebSocket } from 'obs-websocket-js';
import { injectDefaults } from '../store/defaults';
import Logger from '../logging/logger';

let obs;
let isConnected = false;
let reconnectLoop = false;
let reconnectInterval = 5000;

function getOBSInstance(mainWindow = null) {
  if (!obs) {
    obs = new OBSWebSocket();

    obs.on('ConnectionClosed', () => {
      isConnected = false;
      Logger.warn('OBS Studio connection closed');
      mainWindow?.webContents.send('obs-connection', {
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
      mainWindow?.webContents.send('obs-connection', {
        success: true,
        status: 'connected',
        softwareType: 'obs-studio',
        data: null,
        error: null
      });
    });

    obs.on('StreamStateChanged', (data) => {
      mainWindow?.webContents.send('obs-connection', {
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

  const attemptReconnect = async () => {
    if (!isConnected) {
      Logger.log('Attempting to connect to OBS Studio...');
      try {
        const res = await connectToOBS(mainWindow);
        if (res.success) {
          Logger.log('Connected to OBS Studio successfully.');
          reconnectLoop = false;
          return { success: true, data: null, error: null };
        }
      } catch (err) {
        Logger.error(`Connect attempt failed: ${err}`);
        mainWindow?.webContents.send('obs-connection', { success: false });
        return { success: false, data: null, error: err };
      }
      setTimeout(attemptReconnect, reconnectInterval);
    } else {
      reconnectLoop = false;
    }
  };

  setTimeout(attemptReconnect, reconnectInterval);
}

export async function connectToOBS(mainWindow = null) {
  const { streamingSoftwareConfig } = injectDefaults();
  const obsConfig = streamingSoftwareConfig.get('obs-studio');

  const address = `ws://${obsConfig.host}:${obsConfig.port}`;
  const password = obsConfig.password;

  const obsInstance = getOBSInstance(mainWindow);

  obsInstance.on('ConnectionClosed', () => {
    isConnected = false;
    Logger.warn('OBS Studio connection closed');
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
      Logger.info('Stream already running');
      return { success: false, data: null, error: null };
    }
    //TODO: check if there is any response from the obs.call function
    await obs.call('StartStream');
    Logger.success('Stream successfully started');
    return { success: true, data: null, error: null };
  } catch (error) {
    Logger.error('Stream start failed');
    return { success: false, data: null, error: error };
  }
}

export async function stopStream() {
  const { data } = await getStreamState();
  if (!data) {
    Logger.error('OBS returns null');
    return { success: false, data: null, error: null };
  }
  if (!data.outputActive) {
    Logger.info(`Stream isn't running`);
    return { success: false, data: null, error: null };
  }

  //TODO: check if there is any response from the obs.call function
  await obs.call('StopStream');
  Logger.success('Stream successfully stopped');
  return { success: true, data: null, error: null };
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
      //TODO: check if there is any response from the obs.call function
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

export async function refreshMediaSources() {
  if (isRefreshing) {
    Logger.error('Refreshing is already running...');
    return { success: false, data: null, error: null };
  }

  isRefreshing = true;

  try {
    const scenes = await obs.call('GetSceneList');
    const items = await obs.call('GetSceneItemList', {
      sceneName: scenes.currentProgramSceneName
    });

    const activeItems = [];
    // Filter for ffmpeg_sources
    for (const i of items.sceneItems) {
      if (i.sceneItemEnabled === true && i.inputKind === 'ffmpeg_source') {
        // Get the url path from the input
        const inputSettings = await obs.call('GetInputSettings', {
          inputName: i.sourceName
        });

        // Check if the item has a srt, srtla or rtmp feed on it
        const input = inputSettings.inputSettings.input || '';
        if (input.toLowerCase().startsWith('rtmp') || input.toLowerCase().startsWith('srt')) {
          activeItems.push({
            sourceName: i.sourceName,
            sceneItemId: i.sceneItemId,
            sceneName: scenes.currentProgramSceneName
          });
        }
      }
    }
    // Disable all items at once
    await Promise.all(
      activeItems.map((item) =>
        obs.call('SetSceneItemEnabled', {
          sceneName: item.sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: false
        })
      )
    );

    // Timeout for 2 seconde
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Enable all items at once
    await Promise.all(
      activeItems.map((item) =>
        obs.call('SetSceneItemEnabled', {
          sceneName: item.sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: true
        })
      )
    );
    Logger.success('Refreshed all relevant sources');
    return { success: true };
  } catch (error) {
    Logger.error('Refreshing failed');
    return { success: false };
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
    Logger.err(`Error getting scene item list: ${error.message}`);
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
    Logger.err(`Error getting input settings: ${error.message}`);
    return { success: false, data: null, error: error };
  }
}

export async function getCurrentProgramScene() {
  try {
    const scenes = await obs.call('GetCurrentProgramScene');
    return { success: true, data: scenes, error: null };
  } catch (error) {
    Logger.err(`Error getting current program scene: ${error.message}`);
    return { success: false, data: null, error: error };
  }
}
