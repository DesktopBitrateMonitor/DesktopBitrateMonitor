import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StreamStatsContext = createContext(null);
StreamStatsContext.displayName = 'StreamStatsContext';

const INITIAL_STATS = {
  bitrate: 0,
  rtt: 0,
  uptime: 0
};

export const StreamStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(INITIAL_STATS);

  useEffect(() => {
    const api = window?.statesApi;
    if (!api?.serverConnected) return undefined;

    const unsubscribe = api.serverConnected((response = {}) => {
      const publisherData = response?.data?.publisher;
      const legacyPublishers = response?.data?.publishers;
      const firstLegacyPublisherKey = legacyPublishers ? Object.keys(legacyPublishers)[0] : null;
      const legacyData = firstLegacyPublisherKey ? legacyPublishers[firstLegacyPublisherKey] : null;

      const incoming = publisherData && typeof publisherData === 'object' ? publisherData : legacyData;

      const nextBitrate = Number(incoming?.bitrate) || 0;
      const nextRtt = Number(incoming?.rtt) || 0;
      const nextUptime = Number(incoming?.uptime) || 0;

      setStats({ bitrate: nextBitrate, rtt: nextRtt, uptime: nextUptime });
    });

    return () => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn('Failed to cleanup serverConnected listener', error);
      }
    };
  }, []);

  const value = useMemo(() => ({ stats }), [stats]);

  return <StreamStatsContext.Provider value={value}>{children}</StreamStatsContext.Provider>;
};

export const useStreamStats = () => {
  const ctx = useContext(StreamStatsContext);
  if (!ctx) throw new Error('useStreamStats must be used within StreamStatsProvider');
  return ctx;
};
