import { ipcRenderer } from 'electron';

export const storeApi = {
  set: (file, key, value) => ipcRenderer.invoke('electron-store:set', file, key, value),
  get: (file, key) => ipcRenderer.invoke('electron-store:get', file, key),
  delete: (file, key) => ipcRenderer.invoke('electron-store:delete', file, key),
  reset: (file, key) => ipcRenderer.invoke('electron-store:reset', file, key)
};
