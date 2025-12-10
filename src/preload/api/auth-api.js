import { ipcRenderer } from 'electron';

export const authApi = {
  startAuthProcess: () => {
    ipcRenderer.send('start-auth-process');
  },
  getAuthToken: (token) => ipcRenderer.invoke('get-auth-token', token),
  setAuthToken: (callback) => {
    ipcRenderer.invoke('set-auth-token', (token, value) => {
      callback(token, value);
    });
  },
  openAuthWindow: (url) => ipcRenderer.send('open-auth-window', url)
};
