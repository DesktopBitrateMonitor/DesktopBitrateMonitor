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
  createLogFile: (type, fullPath, content) =>
    ipcRenderer.invoke('create-log-file', type, fullPath, content),
  writeToSessionLogFile: (content) => ipcRenderer.invoke('write-to-session-log-file', content),
  writeToActionsLogFile: (content) => ipcRenderer.invoke('write-to-actions-log-file', content),
  readSessionLogFile: (options) => ipcRenderer.invoke('read-session-log-file', options),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options)
};
