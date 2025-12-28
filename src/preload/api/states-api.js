import { ipcRenderer } from 'electron';

export const statesApi = {
  serverConnected: (callback) => {
    const listener = (event, args = {}) => {
      callback(args);
    };

    ipcRenderer.on('server-connected', listener);

    return () => {
      ipcRenderer.removeListener('server-connected', listener);
    };
  },

  streamingSoftwareConnected: (callback) => {
    const listener = (event, args = {}) => {
      callback(args);
    };

    ipcRenderer.on('obs-connection', listener);

    return () => {
      ipcRenderer.removeListener('obs-connection', listener);
    };
  },

  twitchEventSubConnected: (callback) => {
    const listener = (event, args = {}) => {
      callback(args);
    };

    ipcRenderer.on('twitch-eventsub-connection', listener);

    return () => {
      ipcRenderer.removeListener('twitch-eventsub-connection', listener);
    };
  },

  switchCounterUpdate: (callback) => {
    const listener = (event, args = {}) => {
      callback(args);
    };
    ipcRenderer.on('switch-counter-update', listener);

    return () => {
      ipcRenderer.removeListener('switch-counter-update', listener);
    };
  }
};
