import { observable } from '@legendapp/state';

const globalInternalStore = observable({
  stats: {
    bitrate: 0,
    rtt: 0,
    uptime: 0
  },
  currentScene: null as string | null,
  // Per-instance latest result, keyed by instanceId.
  // Populated by stats-fetcher; consumed by the switcher service.
  instanceStats: {} as Record<
    string,
    { success: boolean; data: { bitrate: number; rtt: number; uptime: number } | null; error: any }
  >
});

export default globalInternalStore;
