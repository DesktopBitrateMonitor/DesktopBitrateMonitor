import { shell } from 'electron';
import Logger from '../../scripts/logging/logger';
import { startTwitchAuthorization } from '../../scripts/authorization/twitch-auth';
import { getUsers, revokeTwitchAccessToken } from '../../scripts/twitch/twitch-api';
import { getUser, revokeKickAccessToken } from '../../scripts/kick/kick-api';
import { getYoutubeUsers, revokeYoutubeAccessToken } from '../../scripts/youtube/youtube-api';
import { injectDefaults } from '../../scripts/store/defaults';
import { disconnectTwitchEventSubs } from '../../scripts/twitch/event-subscriptions/eventsubs';
import { startKickAuthorization } from '../../scripts/authorization/kick-auth';
import { disconnectKickEventSub } from '../../scripts/kick/event-subscriptions/eventsubs';
import { startYoutubeAuthorization } from '../../scripts/authorization/youtube-auth';

let isAuthIpcInitialized = false;

const { twitchAccountsConfig, kickAccountsConfig, youtubeAccountsConfig } = injectDefaults();

export async function initializeAuthIpc(ipcMain) {
  if (isAuthIpcInitialized) {
    Logger.warn('Auth IPC already initialized, skipping...');
    return;
  }

  Logger.log('Initializing Auth IPC');

  isAuthIpcInitialized = true;

  ipcMain.handle('start-twitch-auth-process', (event, accountType) => {
    Logger.log(`Starting Twitch auth process for ${accountType}...`);
    const url = startTwitchAuthorization(accountType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-twitch-auth-token', async (event, accountType) => {
    Logger.log(`Revoking Twitch auth token...`);
    const res = await revokeTwitchAccessToken(accountType);
    await disconnectTwitchEventSubs();
    return res;
  });

  // userType returned to the frontend to store the user in the write store (admin or moderator)
  ipcMain.handle('validate-twitch-user', async (event, userType, userName) => {
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');

    const user = await getUsers(access_token, { user_name: userName }, 'broadcaster');
    return { success: true, data: { user: user, userType } };
  });

  ipcMain.handle('start-kick-auth-process', async (event, accountType) => {
    Logger.log(`Starting KICK auth process for ${accountType}...`);
    const url = await startKickAuthorization(accountType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-kick-auth-token', async (event, accountType) => {
    Logger.log(`Revoking KICK auth token...`);
    const res = await revokeKickAccessToken(accountType);
    await disconnectKickEventSub();
    return res;
  });

  // userType returned to the frontend to store the user in the write store (admin or moderator)
  ipcMain.handle('validate-kick-user', async (event, userType, userName) => {
    const access_token = kickAccountsConfig.get('broadcaster.access_token');
    const user = await getUser(access_token, userName);
    return { success: true, data: { user: user, userType } };
  });

  ipcMain.handle('start-youtube-auth-process', async (event, accountType) => {
    Logger.log(`Starting YouTube auth process for ${accountType}...`);
    const url = await startYoutubeAuthorization(accountType);
    shell.openExternal(url);
  });

  ipcMain.handle('revoke-youtube-auth-token', async (event, accountType) => {
    Logger.log(`Revoking YouTube auth token...`);
    const res = await revokeYoutubeAccessToken(accountType);
    return res;
  });

  // userType returned to the frontend to store the user in the write store (admin or moderator)
  ipcMain.handle('validate-youtube-user', async (event, userType, userName) => {
    const access_token = youtubeAccountsConfig.get('broadcaster.access_token');
    const user = await getYoutubeUsers(access_token, userName, 'broadcaster');
    return { success: true, data: { user: user, userType } };
  });
}
