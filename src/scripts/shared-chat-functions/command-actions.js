import { BrowserWindow } from 'electron';
import { getUser } from '../kick/kick-api';
import { getUsers } from '../twitch/twitch-api';
import {
  startStream,
  stopStream,
  setCurrentProgramScene,
  fixMediaSources
} from '../streaming-software/obs-api';
import Logger from '../logging/logger';
import globalInternalStore from '../store/global-internal-store';

/**
 *
 * @param {string} platform - The streaming platform (e.g., 'twitch' or 'kick') that the command is being executed on.
 * @param {function} messageService - A function to send messages back to the chat, typically for command execution feedback.
 * @param {string} server - The current server type (e.g., 'belabox', 'openirl', 'srt-live-server') from which stats are being fetched, used for context in command actions.
 * @param {object} switcherConfig - The configuration object for stream switching, containing scene names and bitrate triggers.
 * @param {object} accountConfig - The configuration object for account details, including broadcaster info and user lists.
 * @returns {object} An object mapping command action names to their corresponding async functions that execute the desired behavior.
 */

export const commandActions = ({
  platform,
  server,
  messageService,
  switcherConfig,
  accountConfig,
  commandsConfig
}) => ({
  startStream: async () => {
    const res = await startStream();
    const config = switcherConfig.get('');
    if (res.success) {
      if (config.switchToStartSceneOnStreamStart) {
        const startScene = config.sceneStart;
        const sceneRes = await setCurrentProgramScene(startScene);
        if (sceneRes.success) {
          Logger.log(`Switched to start scene: ${startScene}`);
        } else {
          Logger.error(`Failed to switch to start scene ${startScene}: ${sceneRes.error}`);
        }
      }
      await messageService({ action: 'startStream', event: 'success', variables: { server } });
      Logger.log('Stream started successfully.');
    } else {
      await messageService({ action: 'startStream', event: 'error', variables: { server } });
      Logger.error(`Failed to start stream: ${res.error}`);
    }
  },
  stopStream: async () => {
    const res = await stopStream();
    if (res.success) {
      await messageService({ action: 'stopStream', event: 'success', variables: { server } });
      Logger.log('Stream stopped successfully.');
    } else {
      await messageService({ action: 'stopStream', event: 'error', variables: { server } });
      Logger.error(`Failed to stop stream: ${res.error}`);
    }
  },
  addAdmin: async (argument) => {
    const user = argument.commandArg;
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'addAdmin',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for addAdmin command.');
      return;
    }
    const access_token = accountConfig.get('broadcaster.access_token');
    const adminUsers = accountConfig.get('admins');

    for (const admin of adminUsers) {
      if (admin.login === user.toLowerCase()) {
        await messageService({
          action: 'addAdmin',
          event: 'alreadyAdmin',
          variables: { user, server }
        });
        Logger.error(`${user} is already an admin.`);
        return;
      }
    }

    let userObj;

    if (platform === 'twitch') {
      userObj = await getUsers(access_token, { user_name: user }, 'broadcaster');
    }
    if (platform === 'kick') {
      userObj = await getUser(access_token, user);
    }

    adminUsers.push(userObj);
    accountConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send(`update-${platform}-user`, {
      type: 'admin',
      action: 'add',
      user: userObj
    });

    await messageService({ action: 'addAdmin', event: 'success', variables: { user, server } });
    return { success: true, data: userObj };
  },
  removeAdmin: async (argument) => {
    const user = argument.commandArg;
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'removeAdmin',
        event: 'error',
        variables: { user: 'undefined', server }
      });
      Logger.error('Invalid username provided for removeAdmin command.');
      return;
    }

    const adminUsers = accountConfig.get('admins');
    const userIndex = adminUsers.findIndex(
      (admin) => admin.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
      await messageService({
        action: 'removeAdmin',
        event: 'notFound',
        variables: { user, server }
      });
      Logger.error(`${user} is not an admin.`);
      return;
    }
    const removedUser = adminUsers.splice(userIndex, 1)[0];
    accountConfig.set('admins', adminUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send(`update-${platform}-user`, {
      type: 'admin',
      action: 'remove',
      user: removedUser
    });
    await messageService({
      action: 'removeAdmin',
      event: 'success',
      variables: { user: removedUser.login, server }
    });
    return { success: true, data: removedUser };
  },
  addMod: async (argument) => {
    const user = argument.commandArg;
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'addMod',
        event: 'error',
        variables: { user: 'undefined', server }
      });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    const access_token = accountConfig.get('broadcaster.access_token');
    const modUsers = accountConfig.get('mods');

    for (const mod of modUsers) {
      if (mod.login === user.toLowerCase()) {
        await messageService({
          action: 'addMod',
          event: 'alreadyMod',
          variables: { user, server }
        });
        Logger.error(`${user} is already a mod.`);
        return;
      }
    }

    let userObj;

    if (platform === 'twitch') {
      userObj = await getUsers(access_token, { user_name: user }, 'broadcaster');
    }
    if (platform === 'kick') {
      userObj = await getUser(access_token, user);
    }

    modUsers.push(userObj);
    accountConfig.set('mods', modUsers);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send(`update-${platform}-user`, {
      type: 'mod',
      action: 'add',
      user: userObj
    });
    await messageService({ action: 'addMod', event: 'success', variables: { user, server } });
    return { success: true, data: userObj };
  },
  removeMod: async (argument) => {
    const user = argument.commandArg;
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'removeMod',
        event: 'error',
        variables: { user: 'undefined', server }
      });
      Logger.error('Invalid username provided for removeMod command.');
      return;
    }

    const modUsers = accountConfig.get('mods');
    const userIndex = modUsers.findIndex((mod) => mod.login.toLowerCase() === user.toLowerCase());
    if (userIndex === -1) {
      await messageService({ action: 'removeMod', event: 'notFound', variables: { user, server } });
      Logger.error(`${user} is not a mod.`);
      return;
    }
    const removedUser = modUsers.splice(userIndex, 1)[0];
    accountConfig.set('mods', modUsers);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send(`update-${platform}-user`, {
      type: 'mod',
      action: 'remove',
      user: removedUser
    });

    await messageService({
      action: 'removeMod',
      event: 'success',
      variables: { user: removedUser.login, server }
    });
    return { success: true, data: removedUser };
  },
  switchToLow: async () => {
    const scene = switcherConfig.get('sceneLow');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      console.log(scene);
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene, server }
      });
      Logger.log('Switched to low scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene, server } });
      Logger.error(`Failed to switch to low scene: ${res.error}`);
    }
  },
  switchToLive: async () => {
    const scene = switcherConfig.get('sceneLive');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene, server }
      });
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene, server } });
      Logger.error(`Failed to switch to live scene: ${res.error}`);
    }
  },
  switchToOffline: async () => {
    const scene = switcherConfig.get('sceneOffline');
    const res = await setCurrentProgramScene(scene);
    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene, server }
      });
      Logger.log('Switched to offline scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene, server } });
      Logger.error(`Failed to switch to offline scene: ${res.error}`);
    }
  },
  switchToPrivacy: async () => {
    const scene = switcherConfig.get('scenePrivacy');
    const res = await setCurrentProgramScene(scene);

    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene, server }
      });
      Logger.log('Switched to privacy scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene, server } });
      Logger.error(`Failed to switch to privacy scene: ${res.error}`);
    }
  },
  switchToStart: async () => {
    const scene = switcherConfig.get('sceneStart');
    const res = await setCurrentProgramScene(scene);

    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene, server }
      });
      Logger.log('Switched to start scene.');
    } else {
      await messageService({ action: 'switchScene', event: 'error', variables: { scene, server } });
      Logger.error(`Failed to switch to start scene: ${res.error}`);
    }
  },
  switchScene: async (argument) => {
    const sceneName = argument.commandArg;
    if (typeof sceneName !== 'string' || sceneName.trim().replace(/\s/g, '') === '') {
      await messageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: 'undefined', server }
      });
      Logger.error('Invalid scene provided for switchScene command.');
      return;
    }
    const res = await setCurrentProgramScene(sceneName);

    if (res.success) {
      await messageService({
        action: 'switchScene',
        event: 'success',
        variables: { scene: sceneName, server }
      });
      Logger.log(`Switched to scene: ${sceneName}`);
    } else {
      await messageService({
        action: 'switchScene',
        event: 'error',
        variables: { scene: sceneName, server }
      });
      Logger.error(`Failed to switch to scene ${sceneName}: ${res.error}`);
    }
  },
  refreshStream: async () => {
    await messageService({ action: 'refreshStream', event: 'try', variables: { server } });

    const res = await fixMediaSources();

    if (res.success) {
      await messageService({ action: 'refreshStream', event: 'success', variables: { server } });
      Logger.log('Media sources refreshed successfully.');
    } else {
      await messageService({ action: 'refreshStream', event: 'error', variables: { server } });
      Logger.error(`Failed to refresh media sources: ${res.error}`);
    }
  },
  setTrigger: async (argument) => {
    let triggerValue = argument.commandArg;
    triggerValue = Number(triggerValue);

    if (typeof triggerValue !== 'number' || isNaN(triggerValue)) {
      await messageService({
        action: 'setTrigger',
        event: 'error',
        variables: { trigger: 'undefined', server }
      });
      Logger.error('Invalid trigger value for setTrigger command.');
      return;
    }

    switcherConfig.set('trigger', triggerValue);
    await messageService({
      action: 'setTrigger',
      event: 'success',
      variables: { trigger: triggerValue, server }
    });
  },
  setRTrigger: async (argument) => {
    let rTriggerValue = argument.commandArg;
    rTriggerValue = Number(rTriggerValue);

    if (typeof rTriggerValue !== 'number' || isNaN(rTriggerValue)) {
      await messageService({
        action: 'setRTrigger',
        event: 'error',
        variables: { rtrigger: 'undefined', server }
      });
      Logger.error('Invalid rTrigger value for setRTrigger command.');
      return;
    }
    switcherConfig.set('rTrigger', rTriggerValue);
    await messageService({
      action: 'setRTrigger',
      event: 'success',
      variables: { rtrigger: rTriggerValue, server }
    });
  },
  bitrate: async () => {
    const { stats } = globalInternalStore.get();

    await messageService({
      action: 'bitrate',
      event: 'success',
      variables: { bitrate: stats.bitrate, speed: stats.rtt, server }
    });
  },
  addAlias: async (argument) => {
    const command = argument.aliasCommand;
    const alias = argument.alias;

    const commandsData = commandsConfig.get('commands') || [];
    const allAliases = commandsData.map((cmd) => cmd.cmd.map((c) => c.toLowerCase())).flat();

    // check if command or alias is empty or undefined
    if (!command || !alias) {
      await messageService({
        action: 'addAlias',
        event: 'error',
        variables: { command: command || 'undefined', alias: alias || 'undefined', server }
      });
      Logger.error(
        `Command or alias is undefined for addAlias command. Command: "${command}", Alias: "${alias}"`
      );
      return;
    }

    // Check if the command exists

    if (!allAliases.includes(command.toLowerCase())) {
      await messageService({
        action: 'addAlias',
        event: 'commandNotFound',
        variables: { command, alias, server }
      });
      Logger.error(`Command: "${command}" not found for addAlias command.`);
      return;
    }

    // Check if the alias already exists as an alias for an command
    if (allAliases.includes(alias.toLowerCase())) {
      const existingCommand = commandsData.find((cmd) =>
        cmd.cmd.map((c) => c.toLowerCase()).includes(alias.toLowerCase())
      );
      await messageService({
        action: 'addAlias',
        event: 'alreadyExists',
        variables: { command: existingCommand.action, alias, server }
      });

      Logger.error(`Alias: "${alias}" already exists for command: "${existingCommand.action}"`);
      return;
    }

    const commandToAddAlias = commandsData.find((cmd) =>
      cmd.cmd.map((c) => c.toLowerCase()).includes(command.toLowerCase())
    );
    if (!commandToAddAlias) {
      await messageService({
        action: 'addAlias',
        event: 'error',
        variables: { command, alias, server }
      });
      Logger.error(`Command: "${command}" not found for addAlias command.`);
      return;
    }

    commandToAddAlias.cmd.push(alias);
    commandsConfig.set('commands', commandsData);

    await messageService({
      action: 'addAlias',
      event: 'success',
      variables: { command, alias, server }
    });
  },
  removeAlias: async (argument) => {
    const alias = argument.aliasToRemove;
    const commandsData = commandsConfig.get('commands') || [];
    const allAliases = commandsData.map((cmd) => cmd.cmd.map((c) => c.toLowerCase())).flat();

    console.log(argument);
    console.log(alias);

    // check if alias is empty or undefined
    if (!alias) {
      await messageService({
        action: 'removeAlias',
        event: 'error',
        variables: { alias: 'undefined', server }
      });
      Logger.error(`Alias is undefined`);
      return;
    }

    // Check if the alias exists
    if (!allAliases.includes(alias.toLowerCase())) {
      await messageService({
        action: 'removeAlias',
        event: 'notFound',
        variables: { alias, server }
      });
      Logger.error(`Alias: "${alias}" not found in commands`);
      return;
    }

    const commandToAddAlias = commandsData.find((cmd) =>
      cmd.cmd.map((c) => c.toLowerCase()).includes(alias.toLowerCase())
    );

    if (!commandToAddAlias) {
      await messageService({
        action: 'removeAlias',
        event: 'error',
        variables: { alias, server }
      });
      Logger.error(`No command found with alias: "${alias}"`);
      return;
    }

    commandToAddAlias.cmd = commandToAddAlias.cmd.filter(
      (c) => c.toLowerCase() !== alias.toLowerCase()
    );
    commandsConfig.set('commands', commandsData);

    await messageService({
      action: 'removeAlias',
      event: 'success',
      variables: { command: commandToAddAlias.action, alias, server }
    });
  }
});
