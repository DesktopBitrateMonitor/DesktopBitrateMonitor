import { ipcRenderer } from 'electron';

export const loggerApi = {
  newLogEvent: (callback) => {
    ipcRenderer.on('log-message', (event, log) => {
      callback(log);
    });
  },
  removeLogEvent: () => {
    ipcRenderer.removeAllListeners('log-message');
  },
  createLogFile: (fullPath, content) => ipcRenderer.invoke('create-log-file', fullPath, content),
  readLogFile: (fullPath) => ipcRenderer.invoke('read-log-file', fullPath),
  getLogFileSizeInMB: (fullPath) => ipcRenderer.invoke('get-log-file-size-mb', fullPath),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
};
