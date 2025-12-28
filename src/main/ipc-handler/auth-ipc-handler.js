import { shell } from 'electron';
import Logger from '../../scripts/logging/logger';
import { startAuthorization } from '../../scripts/twitch/auth-server';
import { getUsers, revokeAccessToken } from '../../scripts/twitch/twitch-api';
import { injectDefaults } from '../../scripts/store/defaults';
import { disconnectEventSubs } from '../../scripts/twitch/event-subscriptions/eventsubs';

let isAuthIpcInitialized = false;

const { accountsConfig } = injectDefaults();

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

  ipcMain.handle('revoke-auth-token', async (event, accessToken) => {
    Logger.log(`Revoking auth token...`);
    const res = await revokeAccessToken(accessToken);
    disconnectEventSubs();
    return res;
  });

  ipcMain.handle('validate-user', async (event, userType, userName) => {
    const access_token = accountsConfig.get('broadcaster.access_token');

    const user = await getUsers(access_token, { user_name: userName }, 'broadcaster');
    return { success: true, data: { user: user, userType } };
  });
}
