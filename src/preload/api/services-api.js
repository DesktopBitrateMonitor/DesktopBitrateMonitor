import { ipcRenderer } from 'electron';

export const servicesApi = {
  reconnectBroadcastSoftware: (type) => ipcRenderer.invoke('reconnect-broadcast-software', type),
  restartStatsFetcherService: (serviceName) =>
    ipcRenderer.invoke('restart-stats-fetcher-service', serviceName),
  connectToActivePlatform: (platform) => ipcRenderer.invoke('connect-to-active-platform', platform),
  reloadOverlay: (data) => ipcRenderer.send('reload-overlay', data)
};
