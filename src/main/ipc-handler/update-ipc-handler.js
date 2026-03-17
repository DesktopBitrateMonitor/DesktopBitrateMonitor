import { app, shell } from 'electron';
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
    sendUpdateState({ status: 'update-app', data: null });
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('check-for-updates', () => {
    sendUpdateState({ status: 'check-for-updates', data: null });
    console.log('Manually checking for updates...');
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('open-external', (event, url) => {
    const appendedUrl = url + app.getVersion();
    console.log(appendedUrl);
    if (url) {
      shell.openExternal(appendedUrl);
    }
  });

  autoUpdater.on('checking-for-update', () => {
    sendUpdateState({ status: 'checking-for-update', data: null });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateState({ status: 'update-available', data: info });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateState({ status: 'update-not-available', data: null });
  });

  autoUpdater.on('download-progress', (data) => {
    sendUpdateState({ status: 'download-progress', data: data });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateState({ status: 'update-downloaded', data: info });
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    sendUpdateState({ status: 'error', data: error?.message || error });
  });
}
