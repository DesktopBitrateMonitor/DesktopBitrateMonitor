import { shell } from 'electron';
import Logger from '../../scripts/logging/logger';
import { startTwitchAuthorization } from '../../scripts/authorization/twitch-auth';
import { getUsers, revokeTwitchAccessToken } from '../../scripts/twitch/twitch-api';
import { getUser, revokeKickAccessToken } from '../../scripts/kick/kick-api';
import { getYoutubeChannelByName, getYoutubeUserByName } from '../../scripts/youtube/youtube-api';
import { refreshYoutubeCookies } from '../../scripts/authorization/youtube-auth';
import { injectDefaults } from '../../scripts/store/defaults';
import { disconnectTwitchEventSubs } from '../../scripts/twitch/event-subscriptions/eventsubs';
import { startKickAuthorization } from '../../scripts/authorization/kick-auth';
import { disconnectKickEventSub } from '../../scripts/kick/event-subscriptions/eventsubs';
import { connectToActivePlatforms } from '../lib/initialize-services';
import {
  fetchLiveChatMessages,
  stopYouTubeChatPolling
} from '../../scripts/youtube/chat-fetching/chat-fetcher';

let isAuthIpcInitialized = false;

const { twitchAccountsConfig, kickAccountsConfig, appConfig } = injectDefaults();

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

  // userType returned to the frontend to store the user in the write store (admin or moderator)
  ipcMain.handle('validate-youtube-user', async (event, userType, userName) => {
    try {
      const user = await getYoutubeUserByName(userName);
      if (user && user.id) {
        return { success: true, data: { user, userType } };
      } else {
        return { success: false, error: 'Channel not found' };
      }
    } catch (error) {
      Logger.error(`Error validating YouTube user: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // Validate YouTube channel by name (no authentication needed)
  ipcMain.handle('validate-youtube-channel-by-name', async (event, channelName) => {
    try {
      const channelData = await getYoutubeChannelByName(channelName);
      if (channelData && channelData.id) {
        return { success: true, data: channelData };
      } else {
        return { success: false, error: 'Channel not found' };
      }
    } catch (error) {
      Logger.error(`Error validating YouTube channel: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-youtube-cookies', async (event, accountType = 'broadcaster') => {
    return await refreshYoutubeCookies(accountType, { allowExistingCookies: true });
  });

  ipcMain.handle('logout-youtube-user', async (event, accountType) => {
    const res = await stopYouTubeChatPolling();
    return res;
  });
}
