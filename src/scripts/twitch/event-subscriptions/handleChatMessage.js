import { injectDefaults } from '../../store/defaults';
import { hasPermission } from './lib';
import { BrowserWindow } from 'electron';

import {
  startStream,
  stopStream,
  getCurrentProgramScene,
  setCurrentProgramScene
} from '../../streaming-software/obs-api';
import Logger from '../../logging/logger';
import { getUsers } from '../twitch-api';

const { messagesConfig, commandsConfig, twitchAccountsConfig } = injectDefaults();

export function handleChatMessage(eventSub) {
  const event = eventSub.event;
  const { source_broadcaster_user_id, broadcaster_user_id } = eventSub.event;
  const message = event.message.text;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.length > 1 ? args[1].toLowerCase() : null;

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
      Logger.log('Stream started successfully.');
    } else {
      Logger.error(`Failed to start stream: ${res.error}`);
    }
  },
  stopStream: async () => {
    const res = await stopStream();
    if (res.success) {
      Logger.log('Stream stopped successfully.');
    } else {
      Logger.error(`Failed to stop stream: ${res.error}`);
    }
  },
  addAdmin: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      Logger.error('Invalid username provided for addAdmin command.');
      return;
    }
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');
    const adminUsers = twitchAccountsConfig.get('admins');

    for (const admin of adminUsers) {
      if (admin.login === user.toLowerCase()) {
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
    //TODO: post message to chat

    return { success: true, data: userObj };
  },
  removeAdmin: (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      Logger.error('Invalid username provided for removeAdmin command.');
      return;
    }

    const adminUsers = twitchAccountsConfig.get('admins');
    const userIndex = adminUsers.findIndex(
      (admin) => admin.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
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
    //TODO: post message to chat
    return { success: true, data: removedUser };
  },
  addMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    const access_token = twitchAccountsConfig.get('broadcaster.access_token');
    const modUsers = twitchAccountsConfig.get('mods');

    for (const mod of modUsers) {
      if (mod.login === user.toLowerCase()) {
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
    //TODO: post message to chat

    return { success: true, data: userObj };
  },
  removeMod: (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      Logger.error('Invalid username provided for removeMod command.');
      return;
    }

    const modUsers = twitchAccountsConfig.get('mods');
    const userIndex = modUsers.findIndex(
      (mod) => mod.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
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
    //TODO: post message to chat
    return { success: true, data: removedUser };
  },
  switchScene: (sceneName) => {},
  refreshStream: () => {},
  setTrigger: (triggerValue) => {},
  setRTrigger: (rTriggerValue) => {},
  bitrate: () => {}
};
