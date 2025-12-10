import { shell } from 'electron';
import Logger from '../../scripts/logger';
import { startAuthorization } from '../../scripts/twitch/auth-server';

let isAuthIpcInitialized = false;

export async function initializeAuthIpc(ipcMain) {
  if (isAuthIpcInitialized) {
    Logger.warn('Auth IPC already initialized, skipping...');
    return;
  }

  isAuthIpcInitialized = true;

  ipcMain.on('start-auth-process', () => {
    const url = startAuthorization();
    shell.openExternal(url);
  });
}
