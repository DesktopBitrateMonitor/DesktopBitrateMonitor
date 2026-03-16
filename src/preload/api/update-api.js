import { ipcRenderer } from 'electron';

export const updateApi = {
  onUpdateWatcher: (callback) => {
    ipcRenderer.on('update-watcher', (event, payload) => {
      callback(payload);
    });
  },
  startUpdate: () => ipcRenderer.send('update-app'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
};
