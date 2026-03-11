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

  ipcMain.handle('restart-stats-fetcher-service', async (event, serviceName) => {
    switch (serviceName) {
      case 'server-stats-fetcher':
        const res = await startFetchingServerStats(mainWindow);
        return res;
      default:
        Logger.warn(`Unknown service name: ${serviceName}`);
        break;
    }
  });

  ipcMain.handle('connect-to-active-platform', async (event, platform) => {
    console.log(`Received request to connect to active platform: ${platform}`);
    await connectToActivePlatform(mainWindow, platform);
  });
}
