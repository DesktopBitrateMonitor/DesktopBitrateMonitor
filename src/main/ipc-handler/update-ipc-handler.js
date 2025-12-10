import Logger from '../../scripts/logger';
import { autoUpdater } from 'electron-updater';

let updateIpcInitialized = false;
export async function initializeUpdateIpc(ipcMain) {
  if (updateIpcInitialized) {
    Logger.warn('Automatic update IPC already initialized, skipping...');
    return;
  }
  updateIpcInitialized = true;

  Logger.info('Initializing Update IPC');

  ipcMain.on('update-app', () => {
    autoUpdater.downloadUpdate();
  });

  // Stops the running app an install the update
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
  });

  // Returns true new release is available
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-watcher', { updateState: true });
  });

  // Returns false no new release is available
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-watcher', { updateState: false });
  });

  // Returns processing if download is in progress
  autoUpdater.on('download-progress', () => {
    mainWindow.webContents.send('update-watcher', { updateState: 'processing' });
  });

  // Returns error updating failure
  autoUpdater.on('error', () => {
    mainWindow.webContents.send('update-watcher', { updateState: 'error' });
  });
}
