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
  const lastUptimeRef = useRef(0);

  useEffect(() => {
    const api = window?.statesApi;
    if (!api?.serverConnected) return undefined;

    const unsubscribe = api.serverConnected((response = {}) => {
      const publisherData = response?.data?.publisher;
      const legacyPublishers = response?.data?.publishers;
      const firstLegacyPublisherKey = legacyPublishers ? Object.keys(legacyPublishers)[0] : null;
      const legacyData = firstLegacyPublisherKey ? legacyPublishers[firstLegacyPublisherKey] : null;
      let incoming = null;

      // If not nginx-rtmp use publishers key data (new format), otherwise use the root response data (nginx-rtmp format)
      if (response?.server !== 'nginx-rtmp') {
        incoming = publisherData && typeof publisherData === 'object' ? publisherData : legacyData;
      } else {
        incoming = response?.data;
      }

      const nextBitrate = Number(incoming?.bitrate) || 0;
      const nextRtt = Number(incoming?.rtt) || 0;
      const nextUptime = Number(incoming?.uptime) || 0;
      const nextServerType = incoming?.serverType || null;

      setStats({ bitrate: nextBitrate, rtt: nextRtt, uptime: nextUptime, serverType: nextServerType });

      // accumulate uptime across page changes (resets only on app restart)
      const delta = Math.max(nextUptime - (lastUptimeRef.current || 0), 0);
      if (delta > 0) {
        setTotalUptime((prev) => prev + delta);
      }
      lastUptimeRef.current = nextUptime;
    });

    return () => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn('Failed to cleanup serverConnected listener', error);
      }
    };
  }, []);

  const value = useMemo(() => ({ stats, totalUptime }), [stats, totalUptime]);

  return <StreamStatsContext.Provider value={value}>{children}</StreamStatsContext.Provider>;
};

export const useStreamStats = () => {
  const ctx = useContext(StreamStatsContext);
  if (!ctx) throw new Error('useStreamStats must be used within StreamStatsProvider');
  return ctx;
};
