import { ipcRenderer } from 'electron';

export const updateApi = {
  updateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => {
      callback(info);
    });
  }
};
