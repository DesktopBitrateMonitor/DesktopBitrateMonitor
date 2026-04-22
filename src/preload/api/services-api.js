import { ipcRenderer } from 'electron';

export const servicesApi = {
  reconnectBroadcastSoftware: (type) => ipcRenderer.invoke('reconnect-broadcast-software', type),
  restartStatsFetcherService: () => ipcRenderer.invoke('restart-stats-fetcher-service'),
  connectToActivePlatforms: () => ipcRenderer.invoke('connect-to-active-platform'),
  reloadOverlay: (data) => ipcRenderer.send('reload-overlay', data),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  saveBackup: async (data, options) => {
    const res = await ipcRenderer.invoke('save-backup', data, options);
    return res;
  },
  loadBackup: async (options) => {
    const res = await ipcRenderer.invoke('load-backup', options);
    return res;
  }
};
