import { ipcRenderer } from 'electron';

export const servicesApi = {
  reconnectBroadcastSoftware: (type) => ipcRenderer.invoke('reconnect-broadcast-software', type),
  restartService: (serviceName) => ipcRenderer.invoke('restart-service', serviceName)
};
