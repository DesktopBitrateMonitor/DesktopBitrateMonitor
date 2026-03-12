import Logger from '../../scripts/logging/logger';
import { autoUpdater } from 'electron-updater';

let updateIpcInitialized = false;
export async function initializeUpdateIpc(ipcMain, mainWindow) {
  if (updateIpcInitialized) {
    Logger.warn('Automatic update IPC already initialized, skipping...');
    return;
  }

  if (!mainWindow) {
    Logger.error('Automatic update IPC cannot initialize without a BrowserWindow instance');
    return;
  }

  updateIpcInitialized = true;

  const sendUpdateState = (payload) => {
    if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-watcher', payload);
    }
  };

  Logger.info('Initializing Update IPC');

  ipcMain.on('update-app', () => {
    sendUpdateState({ status: 'processing', data: null });
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('checking-for-update', () => {
    sendUpdateState({ status: 'checking', data: null });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateState({ status: 'available', data: info });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateState({ status: 'not-available', data: info || null });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateState({ status: 'processing', data: progress });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateState({ status: 'downloaded', data: info });
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    sendUpdateState({ status: 'error', data: error?.message || error });
  });
}
