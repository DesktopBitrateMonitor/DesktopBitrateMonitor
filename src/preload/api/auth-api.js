import { ipcRenderer } from 'electron';

export const authApi = {
  startAuthProcess: (authType) => {
    ipcRenderer.invoke('start-auth-process', authType);
  },
  getAuthToken: (token) => ipcRenderer.invoke('get-auth-token', token),
  setAuthToken: (callback) => {
    ipcRenderer.invoke('set-auth-token', (token, value) => {
      callback(token, value);
    });
  },
  openAuthWindow: (url) => ipcRenderer.send('open-auth-window', url),
  revokeAccessToken: (authType, accessToken) => {
    return ipcRenderer.invoke('revoke-auth-token', authType, accessToken);
  },
  // Send the new OAuth_token to the frontend
  setOauthData: (callback) =>
    ipcRenderer.on('send-oauth-data', (event, data) => {
      callback(data);
    }),

  validateUser: (userType, userName) => {
    return ipcRenderer.invoke('validate-user', userType, userName);
  },
  updateTwitchUser: (callback) => {
    ipcRenderer.on('update-twitch-user', (event, data) => {
      callback(data);
    });
  }
};
