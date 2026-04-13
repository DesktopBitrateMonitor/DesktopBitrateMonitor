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
  revokeTwitchAccessToken: (accountType) => {
    return ipcRenderer.invoke('revoke-twitch-auth-token', accountType);
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

  revokeKickAccessToken: (accountType) => {
    return ipcRenderer.invoke('revoke-kick-auth-token', accountType);
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
  },

  // YOUTUBE AUTH HANDLING
  startYoutubeAuthProcess: (accountType) => {
    ipcRenderer.invoke('start-youtube-auth-process', accountType);
  },

  revokeYoutubeAccessToken: (accountType) => {
    return ipcRenderer.invoke('revoke-youtube-auth-token', accountType);
  },

  // Send the new OAuth_token to the frontend
  setYoutubeOauthData: (callback) =>
    ipcRenderer.on('send-youtube-oauth-data', (event, data) => {
      callback(data);
    }),

  validateYoutubeUser: (userType, userName) => {
    return ipcRenderer.invoke('validate-youtube-user', userType, userName);
  },

  updateYoutubeUser: (callback) => {
    ipcRenderer.on('update-youtube-user', (event, data) => {
      callback(data);
    });
  }
};
