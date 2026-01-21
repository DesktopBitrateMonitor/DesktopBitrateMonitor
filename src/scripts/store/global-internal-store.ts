import { observable } from '@legendapp/state';

const globalInternalStore = observable({
  stats: {
    bitrate: 0,
    rtt: 0,
    uptime: 0
  }
});

export default globalInternalStore;
