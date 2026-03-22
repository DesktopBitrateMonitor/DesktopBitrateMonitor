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
 * @param {object} switcherConfig - The configuration object for stream switching, containing scene names and bitrate triggers.
 * @param {object} accountConfig - The configuration object for account details, including broadcaster info and user lists.
 * @returns {object} An object mapping command action names to their corresponding async functions that execute the desired behavior.
 */

export const commandActions = ({ platform, messageService, switcherConfig, accountConfig }) => ({
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
    const access_token = accountConfig.get('broadcaster.access_token');
    const adminUsers = accountConfig.get('admins');

    for (const admin of adminUsers) {
      if (admin.login === user.toLowerCase()) {
        await messageService({
          action: 'addAdmin',
          event: 'alreadyAdmin',
          variables: { user }
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

    const adminUsers = accountConfig.get('admins');
    const userIndex = adminUsers.findIndex(
      (admin) => admin.login.toLowerCase() === user.toLowerCase()
    );
    if (userIndex === -1) {
      await messageService({ action: 'removeAdmin', event: 'notFound', variables: { user } });
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
      variables: { user: removedUser.login }
    });
    return { success: true, data: removedUser };
  },
  addMod: async (user) => {
    if (typeof user !== 'string' || user.trim().replace(/\s/g, '') === '' || !isNaN(user)) {
      await messageService({
        action: 'addMod',
        event: 'error',
        variables: { user: 'undefined' }
      });
      Logger.error('Invalid username provided for addMod command.');
      return;
    }
    const access_token = accountConfig.get('broadcaster.access_token');
    const modUsers = accountConfig.get('mods');

    for (const mod of modUsers) {
      if (mod.login === user.toLowerCase()) {
        await messageService({ action: 'addMod', event: 'alreadyMod', variables: { user } });
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

    const modUsers = accountConfig.get('mods');
    const userIndex = modUsers.findIndex((mod) => mod.login.toLowerCase() === user.toLowerCase());
    if (userIndex === -1) {
      await messageService({ action: 'removeMod', event: 'notFound', variables: { user } });
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

    const res = await fixMediaSources();

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
    const { stats } = globalInternalStore.get();

    await messageService({
      action: 'bitrate',
      event: 'success',
      variables: { bitrate: stats.bitrate, speed: stats.rtt }
    });
  }
});
