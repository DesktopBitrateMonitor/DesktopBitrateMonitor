import { ipcRenderer } from 'electron';

export const loggerApi = {
  newLogEvent: (callback) => {
    ipcRenderer.on('log-message', (event, log) => {
      callback(log);
    });
  },
  removeLogEvent: () => {
    ipcRenderer.removeAllListeners('log-message');
  }
};
