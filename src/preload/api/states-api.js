import { ipcRenderer } from 'electron';

export const statesApi = {
  instancesStats: (callback) => {
    const listener = (event, args = []) => {
      callback(args);
    };

    ipcRenderer.on('instances-stats', listener);

    return () => {
      ipcRenderer.removeListener('instances-stats', listener);
    };
  },

  streamingSoftwareConnected: (callback) => {
    const listener = (event, args = {}) => {
      callback(args);
    };

    ipcRenderer.on('software-connection', listener);

    return () => {
      ipcRenderer.removeListener('software-connection', listener);
    };
  }

  // twitchEventSubConnected: (callback) => {
  //   const listener = (event, args = {}) => {
  //     callback(args);
  //   };

  //   ipcRenderer.on('twitch-eventsub-connection', listener);

  //   return () => {
  //     ipcRenderer.removeListener('twitch-eventsub-connection', listener);
  //   };
  // },

  // switchCounterUpdate: (callback) => {
  //   const listener = (event, args = {}) => {
  //     callback(args);
  //   };
  //   ipcRenderer.on('switch-counter-update', listener);

  //   return () => {
  //     ipcRenderer.removeListener('switch-counter-update', listener);
  //   };
  // }
};
