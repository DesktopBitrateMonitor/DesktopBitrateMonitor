import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const StreamStatsContext = createContext(null);
StreamStatsContext.displayName = 'StreamStatsContext';

const INITIAL_STATS = {
  bitrate: 0,
  rtt: 0,
  uptime: 0,
  serverType: null
};

export const StreamStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [totalUptime, setTotalUptime] = useState(0);
  const [instancesStats, setInstancesStats] = useState([]);
  const lastUptimeRef = useRef(0);

  useEffect(() => {
    const api = window?.statesApi;
    if (!api?.instancesStats) return undefined;

    const unsubscribe = api.instancesStats((aggregatedArray = []) => {
      setInstancesStats(aggregatedArray);

      // Update primary stats from the highest-priority (first) instance
      if (aggregatedArray.length > 0) {
        const primaryInstance = aggregatedArray[0];
        const incoming = primaryInstance?.data ?? {};

        const nextBitrate = Number(incoming?.bitrate) || 0;
        const nextRtt = Number(incoming?.rtt) || 0;
        const nextUptime = Number(incoming?.uptime) || 0;

        setStats({ bitrate: nextBitrate, rtt: nextRtt, uptime: nextUptime });

        // accumulate uptime across page changes (resets only on app restart)
        const delta = Math.max(nextUptime - (lastUptimeRef.current || 0), 0);
        if (delta > 0) {
          setTotalUptime((prev) => prev + delta);
        }
        lastUptimeRef.current = nextUptime;
      }
    });

    return () => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn('Failed to cleanup instancesStats listener', error);
      }
    };
  }, []);

  const value = useMemo(
    () => ({ stats, totalUptime, instancesStats }),
    [stats, totalUptime, instancesStats]
  );

  return <StreamStatsContext.Provider value={value}>{children}</StreamStatsContext.Provider>;
};

export const useStreamStats = () => {
  const ctx = useContext(StreamStatsContext);
  if (!ctx) throw new Error('useStreamStats must be used within StreamStatsProvider');
  return ctx;
};
