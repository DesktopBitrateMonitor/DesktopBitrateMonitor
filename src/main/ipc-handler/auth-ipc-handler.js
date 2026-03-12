import { shell } from 'electron';
import Logger from '../../scripts/logging/logger';
import { startTwitchAuthorization } from '../../scripts/authorization/twitch-auth';
import { getUsers, revokeTwitchAccessToken } from '../../scripts/twitch/twitch-api';
import { getUser, revokeKickAccessToken } from '../../scripts/kick/kick-api';
import { injectDefaults } from '../../scripts/store/defaults';
import { disconnectTwitchEventSubs } from '../../scripts/twitch/event-subscriptions/eventsubs';
import { startKickAuthorization } from '../../scripts/authorization/kick-auth';
import { disconnectKickEventSub } from '../../scripts/kick/event-subscriptions/eventsubs';

let isAuthIpcInitialized = false;

const { twitchAccountsConfig, kickAccountsConfig } = injectDefaults();

export async function initializeAuthIpc(ipcMain) {
  if (isAuthIpcInitialized) {
    Logger.warn('Auth IPC already initialized, skipping...');
    return;
  }

  Logger.log('Initializing Auth IPC');

  isAuthIpcInitialized = true;

  ipcMain.handle('start-twitch-auth-process', (event, authType) => {
    Logger.log(`Starting Twitch auth process for ${authType}...`);
    const url = startTwitchAuthorization(authType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-twitch-auth-token', async (event, accessToken) => {
    Logger.log(`Revoking Twitch auth token...`);
    const res = await revokeTwitchAccessToken(accessToken);
    await disconnectTwitchEventSubs();
    return res;
  });

  ipcMain.handle('validate-twitch-user', async (event, userType, userName) => {
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');

    const user = await getUsers(access_token, { user_name: userName }, 'broadcaster');
    console.log('twitch user:', user);
    return { success: true, data: { user: user, userType } };
  });

  ipcMain.handle('start-kick-auth-process', async (event, authType) => {
    Logger.log(`Starting KICK auth process for ${authType}...`);
    const url = await startKickAuthorization(authType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-kick-auth-token', async (event, accessToken) => {
    Logger.log(`Revoking KICK auth token...`);
    const res = await revokeKickAccessToken(accessToken);
    await disconnectKickEventSub();
    return res;
  });

  ipcMain.handle('validate-kick-user', async (event, userType, userName) => {
    const access_token = kickAccountsConfig.get('broadcaster.access_token');
    const user = await getUser(access_token, userName);
    return { success: true, data: { user: user, userType } };
  });
}
