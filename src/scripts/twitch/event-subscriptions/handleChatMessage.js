import { injectDefaults } from '../../store/defaults';
import { hasPermission } from './lib';
import { BrowserWindow } from 'electron';

import {
  startStream,
  stopStream,
  setCurrentProgramScene,
  refreshMediaSources
} from '../../streaming-software/obs-api';
import Logger from '../../logging/logger';
import { getUsers } from '../twitch-api';
import { messageService } from '../message-service/chat-messages';
import { fetchStats } from '../../stats-watcher/stats-fetcher';
import { formatStatsOpenIrl } from '../../stats-watcher/openirl';

const { commandsConfig, twitchAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export function handleChatMessage(eventSub) {
  const event = eventSub.event;
  const { source_broadcaster_user_id, broadcaster_user_id } = eventSub.event;
  const message = event.message.text;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.splice(1).join(' ').toLowerCase();

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();

  // Check if the message comes from the write channel
  if (source_broadcaster_user_id && broadcaster_user_id !== source_broadcaster_user_id) return;

  // Check if the command exists in the list of all aliases, otherwise ignore
  if (!allAliases.includes(commandName)) return;

  const commandObject = commandsArray.find((cmd) => cmd.cmd.includes(commandName));
  if (!commandObject) return;

  const requiredCommandRole = commandObject.requiredRole;
  if (!requiredCommandRole) return;

  if (hasPermission({ event, requiredRole: requiredCommandRole })) {
    const commandAction = commandObject.action;
    commandActions[commandAction](commandArg);
  }
}

const commandActions = {
  startStream: async () => {
    const res = await startStream();
    if (res.success) {
      await messageService({ action: 'startStream', event: 'success' });
      Logger.log('Stream started successfully.');
    } else {
      await messageService({ action: 'startStream', event: 'error' });
      Logger.error(`Failed to start stream: ${res.error}`);
    }
  },
  stopStream: async () => {
    const res = await stopStream();
    if (res.success) {
      await messageService({ action: 'stopStream', event: 'success' });
      Logger.log('Stream stopped successfully.');
    } else {
      await messageService({ action: 'stopStream', event: 'error' });
      Logger.error(`Failed to stop stream: ${res.error}`);
    }
  },
  addAdmin: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'addAdmin',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for addAdmin command.');
      return;
    }
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');
    const adminUsers = twitchAccountsConfig.get('admins');

    for (const admin of adminUsers) {
      if (admin.login === user.toLowerCase()) {
        await messageService({ action: 'addAdmin', event: 'alreadyAdmin', variables: { user } });
        Logger.error(`${user} is already an admin.`);
        return;
      }
    }

    const userObj = await getUsers(access_token, { user_name: user }, 'broadcaster');

    adminUsers.push(userObj);
    twitchAccountsConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-twitch-user', {
      type: 'admin',
      action: 'add',
      user: userObj
    });

    await messageService({ action: 'addAdmin', event: 'success', variables: { user } });
    return { success: true, data: userObj };
  },
  removeAdmin: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'removeAdmin',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for removeAdmin command.');
      return;
    }

    const adminUsers = twitchAccountsConfig.get('admins');
    const userIndex = adminUsers.findIndex(
      (admin) => admin.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
      await messageService({ action: 'removeAdmin', event: 'notFound', variables: { user } });
      Logger.error(`${user} is not an admin.`);
      return;
    }
    const removedUser = adminUsers.splice(userIndex, 1)[0];
    twitchAccountsConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-twitch-user', {
      type: 'admin',
      action: 'remove',
      user: removedUser
    });
    await messageService({
      action: 'removeAdmin',
      event: 'success',
      variables: { user: removedUser.login }
    });
    return { success: true, data: removedUser };
  },
  addMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({ action: 'addMod', event: 'error', variables: { user: 'undefined' } });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');
    const modUsers = twitchAccountsConfig.get('mods');

    for (const mod of modUsers) {
      if (mod.login === user.toLowerCase()) {
        await messageService({ action: 'addMod', event: 'alreadyMod', variables: { user } });
        Logger.error(`${user} is already a mod.`);
        return;
      }
    }

    const userObj = await getUsers(access_token, { user_name: user }, 'broadcaster');

    modUsers.push(userObj);
    twitchAccountsConfig.set('mods', modUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-twitch-user', {
      type: 'mod',
      action: 'add',
      user: userObj
    });
    await messageService({ action: 'addMod', event: 'success', variables: { user } });
    return { success: true, data: userObj };
  },
  removeMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'removeMod',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for removeMod command.');
      return;
    }

    const modUsers = twitchAccountsConfig.get('mods');
    const userIndex = modUsers.findIndex((mod) => mod.login.toLowerCase() === user.toLowerCase());
    if (userIndex === -1) {
      await messageService({ action: 'removeMod', event: 'notFound', variables: { user } });
      Logger.error(`${user} is not a mod.`);
      return;
    }
    const removedUser = modUsers.splice(userIndex, 1)[0];
    twitchAccountsConfig.set('mods', modUsers);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-twitch-user', {
      type: 'mod',
      action: 'remove',
      user: removedUser
    });

    await messageService({
      action: 'removeMod',
      event: 'success',
      variables: { user: removedUser.login }
    });
    return { success: true, data: removedUser };
  },
  switchToLow: async () => {
    const scene = switcherConfig.get('sceneLow');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      console.log(scene);
      await messageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to low scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to low scene: ${res.error}`);
    }
  },
  switchToLive: async () => {
    const scene = switcherConfig.get('sceneLive');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await messageService({ action: 'switchScene', event: 'success', variables: { scene } });
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to live scene: ${res.error}`);
    }
  },
  switchToOffline: async () => {
    const scene = switcherConfig.get('sceneOffline');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await messageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to offline scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to offline scene: ${res.error}`);
    }
  },
  switchToPrivacy: async () => {
    const scene = switcherConfig.get('scenePrivacy');
    const res = await setCurrentProgramScene(scene);

    if (res.success) {
      await messageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to privacy scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to privacy scene: ${res.error}`);
    }
  },
  switchScene: async (sceneName) => {
    if (typeof sceneName !== 'string' || sceneName.trim().replace(/\s/g, '') === '') {
      await messageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: 'undefined' }
      });
      Logger.error('Invalid scene provided for switchScene command.');
      return;
    }
    const res = await setCurrentProgramScene(sceneName);

    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene: sceneName }
      });
      Logger.log(`Switched to scene: ${sceneName}`);
    } else {
      await messageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: sceneName }
      });
      Logger.error(`Failed to switch to scene ${sceneName}: ${res.error}`);
    }
  },
  refreshStream: async () => {
    await messageService({ action: 'refreshStream', event: 'try' });

    const res = await refreshMediaSources();

    if (res.success) {
      await messageService({ action: 'refreshStream', event: 'success' });
      Logger.log('Media sources refreshed successfully.');
    } else {
      await messageService({ action: 'refreshStream', event: 'error' });
      Logger.error(`Failed to refresh media sources: ${res.error}`);
    }
  },
  setTrigger: async (triggerValue) => {
    if (
      typeof triggerValue !== 'number' ||
      triggerValue.trim().replace(/\s/g, '') === '' ||
      isNaN(triggerValue)
    ) {
      await messageService({
        action: 'setTrigger',
        event: 'error',
        variables: { trigger: 'undefined' }
      });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    switcherConfig.set('bitrateTrigger', triggerValue);
    await messageService({
      action: 'setTrigger',
      event: 'success',
      variables: { trigger: triggerValue }
    });
  },
  setRTrigger: async (rTriggerValue) => {
    if (
      typeof rTriggerValue !== 'number' ||
      rTriggerValue.trim().replace(/\s/g, '') === '' ||
      isNaN(rTriggerValue)
    ) {
      await messageService({
        action: 'setRTrigger',
        event: 'error',
        variables: { rtrigger: 'undefined' }
      });
    }
    switcherConfig.set('rTrigger', rTriggerValue);
    await messageService({
      action: 'setRTrigger',
      event: 'success',
      variables: { rtrigger: rTriggerValue }
    });
  },
  bitrate: async () => {
    // Return the current bitrate value to the chat
    const serverData = serverConfig.get('');
    const serverType = serverData.currentType;
    const stats = await fetchStats(serverData.statsUrl);
    let res;

    if (serverType === 'openirl') {
      res = await formatStatsOpenIrl(stats);
    }
    if (serverType === 'srt-live-server') {
      res = await formatStatsOpenIrl(stats);
    }
    if (serverType === 'belabox') {
      // Implement when belabox format function is available
    }

    if (res.success) {
      const currentBitrate = res.data.bitrate;
      await messageService({
        action: 'bitrate',
        event: 'success',
        variables: { bitrate: currentBitrate, speed: res.data.rtt }
      });
    } else {
      await messageService({
        action: 'bitrate',
        event: 'error'
      });
    }
  }
};
