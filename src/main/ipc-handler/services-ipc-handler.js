import { dialog, shell } from 'electron';
import fs from 'fs';
import { broadcastOverlay } from '../../scripts/app-server/server';
import Logger from '../../scripts/logging/logger';
import { reconnectToOBS } from '../../scripts/streaming-software/obs-api';
import { connectToActivePlatform, startFetchingServerStats } from '../lib/initialize-services';

let isServicesInitialized = false;

export async function initializeServicesIpc(ipcMain, mainWindow = null) {
  if (isServicesInitialized) {
    Logger.warn('Services IPC already initialized, skipping...');
    return;
  }

  Logger.log('Initializing Services IPC');

  isServicesInitialized = true;

  ipcMain.handle('reconnect-broadcast-software', async (event, type) => {
    switch (type) {
      case 'obs-studio':
        const res = await reconnectToOBS(mainWindow);
        return res;
      case 'streamlabs-obs':
        break;
      case 'meld-studio':
        break;
      default:
        break;
    }
  });

  ipcMain.handle('restart-stats-fetcher-service', async (event) => {
    const res = await startFetchingServerStats(mainWindow);
    return res;
  });

  ipcMain.handle('connect-to-active-platform', async (event, platform) => {
    console.log(`Received request to connect to active platform: ${platform}`);
    await connectToActivePlatform(mainWindow, platform);
  });

  ipcMain.on('reload-overlay', async (event, data) => {
    broadcastOverlay(data);
  });

  ipcMain.handle('open-external', async (event, url) => {
    if (url) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('save-backup', async (event, data, options) => {
    const res = await dialog.showSaveDialog(options);

    if (res.canceled) {
      return { success: false, message: 'Save cancelled' };
    }

    fs.writeFileSync(res.filePath, data);

    return { success: true, message: 'Backup saved successfully' };
  });

  ipcMain.handle('load-backup', async (event, options) => {
    const res = await dialog.showOpenDialog(options);

    if (res.canceled || res.filePaths.length === 0) {
      return { success: false, message: 'Load cancelled' };
    }

    const fileData = fs.readFileSync(res.filePaths[0], 'utf-8');
    return { success: true, data: fileData };
  });
}
