import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORE_REGISTRY = [
  { key: 'appConfig', file: 'app-config' },
  { key: 'loggingConfig', file: 'logging-config' },
  { key: 'commandsConfig', file: 'commands-config' },
  { key: 'messagesConfig', file: 'messages-config' },
  { key: 'accountsConfig', file: 'accounts-config' },
  { key: 'serverConfig', file: 'server-config' },
  { key: 'streamingSoftwareConfig', file: 'streaming-software-config' },
  { key: 'switcherConfig', file: 'switcher-config' }
];

const INITIAL_DATA = STORE_REGISTRY.reduce((acc, { key }) => {
  acc[key] = null;
  return acc;
}, {});

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!window?.storeApi) {
      setError(new Error('storeApi is not available in this environment.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const entries = await Promise.all(
        STORE_REGISTRY.map(async ({ key, file }) => {
          const storeSnapshot = await window.storeApi.get(file, undefined);
          return [key, storeSnapshot];
        })
      );
      setData(Object.fromEntries(entries));
    } catch (err) {
      console.error('Failed to load data from stores', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStoreLocally = useCallback((storeKey, updater) => {
    setData((prev) => {
      const currentValue = prev?.[storeKey];
      const nextValue = typeof updater === 'function' ? updater(currentValue) : updater;
      if (nextValue === currentValue) {
        return prev;
      }
      return {
        ...prev,
        [storeKey]: nextValue
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      reloadStores: loadData,
      updateStoreLocally
    }),
    [data, error, loadData, loading, updateStoreLocally]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
