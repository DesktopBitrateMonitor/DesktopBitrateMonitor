import { shell } from 'electron';
import Logger from '../../scripts/logger';
import { startAuthorization } from '../../scripts/twitch/auth-server';
import { revokeAccessToken } from '../../scripts/twitch/twitch-api';

let isAuthIpcInitialized = false;

export async function initializeAuthIpc(ipcMain) {
  if (isAuthIpcInitialized) {
    Logger.warn('Auth IPC already initialized, skipping...');
    return;
  }

  isAuthIpcInitialized = true;

  ipcMain.handle('start-auth-process', (event, authType) => {
    Logger.log(`Starting auth process for ${authType}...`);
    const url = startAuthorization(authType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-auth-token', (event, accessToken) => {
    Logger.log(`Revoking auth token...`);
    return revokeAccessToken(accessToken);
  });
}
