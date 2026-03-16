import { ipcRenderer } from 'electron';

export const loggerApi = {
  newLogEvent: (callback) => {
    const listener = (_event, log) => {
      callback(log);
    };

    ipcRenderer.on('log-message', listener);
    return () => ipcRenderer.removeListener('log-message', listener);
  },
  removeLogEvent: () => {
    ipcRenderer.removeAllListeners('log-message');
  },
  createLogFile: (fullPath, content) => ipcRenderer.invoke('create-log-file', fullPath, content),
  readLogFile: (fullPath) => ipcRenderer.invoke('read-log-file', fullPath),
  getLogFileSizeInMB: (fullPath) => ipcRenderer.invoke('get-log-file-size-mb', fullPath),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options)
};
