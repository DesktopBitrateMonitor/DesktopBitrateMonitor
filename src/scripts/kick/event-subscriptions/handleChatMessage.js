import { injectDefaults } from '../../store/defaults';
import { hasPermission } from '../lib';
import { BrowserWindow } from 'electron';

import {
  startStream,
  stopStream,
  setCurrentProgramScene,
  fixMediaSources
} from '../../streaming-software/obs-api';
import Logger from '../../logging/logger';
import globalInternalStore from '../../store/global-internal-store';
import { kickMessageService } from '../messages-service/chat-messages';
import { getUser } from '../kick-api';

const { commandsConfig, kickAccountsConfig, switcherConfig } = injectDefaults();

export function handleChatMessage(rawMessage) {
  const message = rawMessage.content;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.slice(1).join(' ').toLowerCase();

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();


  // Check if the message comes from the write channel
  // Figure out if Kick has a multi chat feature and if so, how to identify the source channel of the message
  // if (source_broadcaster_user_id && broadcaster_user_id !== source_broadcaster_user_id) return;

  // Check if the command exists in the list of all aliases, otherwise ignore
  if (!allAliases.includes(commandName)) return;

  // Find the command object based on the command name
  const commandObject = commandsArray.find((cmd) => cmd.cmd.includes(commandName));
  if (!commandObject) return;

  // Check if the command is enabled, if not ignore
  if (!commandObject.enabled) return;

  // Check if the user has the required permissions to execute the command
  const requiredCommandRole = commandObject.requiredRole;
  if (!requiredCommandRole) return;

  if (
    hasPermission({
      event: rawMessage,
      requiredRole: requiredCommandRole,
      restricted: commandObject.restricted
    })
  ) {
    const commandAction = commandObject.action;
    commandActions[commandAction](commandArg);
  }
}

const commandActions = {
  startStream: async () => {
    const res = await startStream();
    if (res.success) {
      await kickMessageService({ action: 'startStream', event: 'success' });
      Logger.log('Stream started successfully.');
    } else {
      await kickMessageService({ action: 'startStream', event: 'error' });
      Logger.error(`Failed to start stream: ${res.error}`);
    }
  },
  stopStream: async () => {
    const res = await stopStream();
    if (res.success) {
      await kickMessageService({ action: 'stopStream', event: 'success' });
      Logger.log('Stream stopped successfully.');
    } else {
      await kickMessageService({ action: 'stopStream', event: 'error' });
      Logger.error(`Failed to stop stream: ${res.error}`);
    }
  },
  addAdmin: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await kickMessageService({
        action: 'addAdmin',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for addAdmin command.');
      return;
    }
    const access_token = kickAccountsConfig.get('broadcaster.access_token');
    const adminUsers = kickAccountsConfig.get('admins');

    for (const admin of adminUsers) {
      if (admin.login === user.toLowerCase()) {
        await kickMessageService({
          action: 'addAdmin',
          event: 'alreadyAdmin',
          variables: { user }
        });
        Logger.error(`${user} is already an admin.`);
        return;
      }
    }

    const userObj = await getUser(access_token, user);

    adminUsers.push(userObj);
    kickAccountsConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-kick-user', {
      type: 'admin',
      action: 'add',
      user: userObj
    });

    await kickMessageService({ action: 'addAdmin', event: 'success', variables: { user } });
    return { success: true, data: userObj };
  },
  removeAdmin: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await kickMessageService({
        action: 'removeAdmin',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for removeAdmin command.');
      return;
    }

    const adminUsers = kickAccountsConfig.get('admins');
    const userIndex = adminUsers.findIndex(
      (admin) => admin.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
      await kickMessageService({ action: 'removeAdmin', event: 'notFound', variables: { user } });
      Logger.error(`${user} is not an admin.`);
      return;
    }
    const removedUser = adminUsers.splice(userIndex, 1)[0];
    kickAccountsConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-kick-user', {
      type: 'admin',
      action: 'remove',
      user: removedUser
    });
    await kickMessageService({
      action: 'removeAdmin',
      event: 'success',
      variables: { user: removedUser.login }
    });
    return { success: true, data: removedUser };
  },
  addMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await kickMessageService({
        action: 'addMod',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    const access_token = kickAccountsConfig.get('broadcaster.access_token');
    const modUsers = kickAccountsConfig.get('mods');

    for (const mod of modUsers) {
      if (mod.login === user.toLowerCase()) {
        await kickMessageService({ action: 'addMod', event: 'alreadyMod', variables: { user } });
        Logger.error(`${user} is already a mod.`);
        return;
      }
    }

    const userObj = await getUser(access_token, user);

    modUsers.push(userObj);
    kickAccountsConfig.set('mods', modUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-kick-user', {
      type: 'mod',
      action: 'add',
      user: userObj
    });
    await kickMessageService({ action: 'addMod', event: 'success', variables: { user } });
    return { success: true, data: userObj };
  },
  removeMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await kickMessageService({
        action: 'removeMod',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for removeMod command.');
      return;
    }

    const modUsers = kickAccountsConfig.get('mods');
    const userIndex = modUsers.findIndex((mod) => mod.login.toLowerCase() === user.toLowerCase());
    if (userIndex === -1) {
      await kickMessageService({ action: 'removeMod', event: 'notFound', variables: { user } });
      Logger.error(`${user} is not a mod.`);
      return;
    }
    const removedUser = modUsers.splice(userIndex, 1)[0];
    kickAccountsConfig.set('mods', modUsers);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('update-kick-user', {
      type: 'mod',
      action: 'remove',
      user: removedUser
    });

    await kickMessageService({
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
      await kickMessageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to low scene.');
    } else {
      await kickMessageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to low scene: ${res.error}`);
    }
  },
  switchToLive: async () => {
    const scene = switcherConfig.get('sceneLive');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await kickMessageService({ action: 'switchScene', event: 'success', variables: { scene } });
    } else {
      await kickMessageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to live scene: ${res.error}`);
    }
  },
  switchToOffline: async () => {
    const scene = switcherConfig.get('sceneOffline');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await kickMessageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to offline scene.');
    } else {
      await kickMessageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to offline scene: ${res.error}`);
    }
  },
  switchToPrivacy: async () => {
    const scene = switcherConfig.get('scenePrivacy');
    const res = await setCurrentProgramScene(scene);

    if (res.success) {
      await kickMessageService({ action: 'switchScene', event: 'success', variables: { scene } });
      Logger.log('Switched to privacy scene.');
    } else {
      await kickMessageService({ action: 'switchScene', event: 'error', variables: { scene } });
      Logger.error(`Failed to switch to privacy scene: ${res.error}`);
    }
  },
  switchScene: async (sceneName) => {
    if (typeof sceneName !== 'string' || sceneName.trim().replace(/\s/g, '') === '') {
      await kickMessageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: 'undefined' }
      });
      Logger.error('Invalid scene provided for switchScene command.');
      return;
    }
    const res = await setCurrentProgramScene(sceneName);

    if (res.success) {
      await kickMessageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene: sceneName }
      });
      Logger.log(`Switched to scene: ${sceneName}`);
    } else {
      await kickMessageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: sceneName }
      });
      Logger.error(`Failed to switch to scene ${sceneName}: ${res.error}`);
    }
  },
  refreshStream: async () => {
    await kickMessageService({ action: 'refreshStream', event: 'try' });

    const res = await fixMediaSources();

    if (res.success) {
      await kickMessageService({ action: 'refreshStream', event: 'success' });
      Logger.log('Media sources refreshed successfully.');
    } else {
      await kickMessageService({ action: 'refreshStream', event: 'error' });
      Logger.error(`Failed to refresh media sources: ${res.error}`);
    }
  },
  setTrigger: async (triggerValue) => {
    if (
      typeof triggerValue !== 'number' ||
      triggerValue.trim().replace(/\s/g, '') === '' ||
      isNaN(triggerValue)
    ) {
      await kickMessageService({
        action: 'setTrigger',
        event: 'error',
        variables: { trigger: 'undefined' }
      });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    switcherConfig.set('bitrateTrigger', triggerValue);
    await kickMessageService({
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
      await kickMessageService({
        action: 'setRTrigger',
        event: 'error',
        variables: { rtrigger: 'undefined' }
      });
    }
    switcherConfig.set('rTrigger', rTriggerValue);
    await kickMessageService({
      action: 'setRTrigger',
      event: 'success',
      variables: { rtrigger: rTriggerValue }
    });
  },
  bitrate: async () => {
    const { stats } = globalInternalStore.get();

    console.log('Current bitrate stats:', stats);

    await kickMessageService({
      action: 'bitrate',
      event: 'success',
      variables: { bitrate: stats.bitrate, speed: stats.rtt }
    });
  }
};
