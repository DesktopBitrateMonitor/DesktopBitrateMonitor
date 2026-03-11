import { ipcRenderer } from 'electron';

export const authApi = {
  getAuthToken: (token) => ipcRenderer.invoke('get-auth-token', token),
  openAuthWindow: (url) => ipcRenderer.send('open-auth-window', url),
  setAuthToken: (callback) => {
    ipcRenderer.invoke('set-auth-token', (token, value) => {
      callback(token, value);
    });
  },

  // TWITCH AUTH HANDLING
  startTwitchAuthProcess: (authType) => {
    ipcRenderer.invoke('start-twitch-auth-process', authType);
  },
  revokeTwitchAccessToken: (authType, accessToken) => {
    return ipcRenderer.invoke('revoke-twitch-auth-token', authType, accessToken);
  },
  // Send the new OAuth_token to the frontend
  setTwitchOauthData: (callback) =>
    ipcRenderer.on('send-twitch-oauth-data', (event, data) => {
      callback(data);
    }),

  validateTwitchUser: (userType, userName) => {
    return ipcRenderer.invoke('validate-twitch-user', userType, userName);
  },
  updateTwitchUser: (callback) => {
    ipcRenderer.on('update-twitch-user', (event, data) => {
      callback(data);
    });
  },

  // KICK AUTH HANDLING
  startKickAuthProcess: (authType) => {
    ipcRenderer.invoke('start-kick-auth-process', authType);
  },

  revokeKickAccessToken: (authType, accessToken) => {
    return ipcRenderer.invoke('revoke-kick-auth-token', authType, accessToken);
  },

  // Send the new OAuth_token to the frontend
  setKickOauthData: (callback) =>
    ipcRenderer.on('send-kick-oauth-data', (event, data) => {
      callback(data);
    }),

  validateKickUser: (userType, userName) => {
    return ipcRenderer.invoke('validate-kick-user', userType, userName);
  },

  updateKickUser: (callback) => {
    ipcRenderer.on('update-kick-user', (event, data) => {
      callback(data);
    });
  }
};
