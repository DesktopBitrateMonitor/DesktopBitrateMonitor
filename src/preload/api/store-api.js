import { ipcRenderer } from 'electron';

export const storeApi = {
  set: (file, key, value) => ipcRenderer.invoke('electron-store:set', file, key, value),
  get: (file, key) => ipcRenderer.invoke('electron-store:get', file, key),
  delete: (file, key) => ipcRenderer.invoke('electron-store:delete', file, key),
  clear: (file, key) => ipcRenderer.invoke('electron-store:clear', file, key)
};
