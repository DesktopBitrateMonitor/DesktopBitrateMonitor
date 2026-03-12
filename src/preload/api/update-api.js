import { ipcRenderer } from 'electron';

export const updateApi = {
  onUpdateWatcher: (callback) => {
    const listener = (_event, payload) => {
      callback(payload);
    };

    ipcRenderer.on('update-watcher', listener);
    return () => ipcRenderer.removeListener('update-watcher', listener);
  },
  startUpdate: () => ipcRenderer.send('update-app')
};
