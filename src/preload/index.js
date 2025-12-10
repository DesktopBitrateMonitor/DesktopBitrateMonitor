import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { loggerApi } from './api/logger-api';
import { updateApi } from './api/update-api';
import { storeApi } from './api/store-api';
import { authApi } from './api/auth-api';

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('storeApi', storeApi);
    contextBridge.exposeInMainWorld('loggerApi', loggerApi);
    contextBridge.exposeInMainWorld('updateApi', updateApi);
    contextBridge.exposeInMainWorld('authApi', authApi);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.storeApi = storeApi;
  window.loggerApi = loggerApi;
  window.updateApi = updateApi;
  window.authAPI = authApi;
}
