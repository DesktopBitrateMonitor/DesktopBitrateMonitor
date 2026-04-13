import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

// Generic hook for a single store snapshot (one config file)
const createStoreContext = (displayName) => {
  const Ctx = createContext(null);
  Ctx.displayName = displayName;
  const useStoreHook = () => {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error(`${displayName} must be used within a DataProvider`);
    }
    return ctx;
  };
  return [Ctx, useStoreHook];
};

// Create one context per store
const [AppConfigContext, useAppConfigInternal] = createStoreContext('AppConfigContext');
const [LoggingConfigContext, useLoggingConfigInternal] = createStoreContext('LoggingConfigContext');
const [CommandsConfigContext, useCommandsConfigInternal] =
  createStoreContext('CommandsConfigContext');
const [MessagesConfigContext, useMessagesConfigInternal] =
  createStoreContext('MessagesConfigContext');
const [TwitchAccountsConfigContext, useTwitchAccountsConfigInternal] = createStoreContext(
  'TwitchAccountsConfigContext'
);
const [KickAccountsConfigContext, useKickAccountsConfigInternal] = createStoreContext(
  'KickAccountsConfigContext'
);
const [ServerConfigContext, useServerConfigInternal] = createStoreContext('ServerConfigContext');
const [StreamingSoftwareConfigContext, useStreamingSoftwareConfigInternal] = createStoreContext(
  'StreamingSoftwareConfigContext'
);
const [SwitcherConfigContext, useSwitcherConfigInternal] =
  createStoreContext('SwitcherConfigContext');
const [OverlayConfigContext, useOverlayConfigInternal] = createStoreContext('OverlayConfigContext');
const [YoutubeAccountsConfigContext, useYoutubeAccountsConfigInternal] = createStoreContext(
  'YoutubeAccountsConfigContext'
);

const useStoreState = (file) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!window?.storeApi) {
      setError(new Error('storeApi is not available in this environment.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const snapshot = await window.storeApi.get(file, undefined);
      setConfig(snapshot);
    } catch (err) {
      console.error(`Failed to load store ${file}`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateLocal = useCallback((updater) => {
    setConfig((prev) => {
      const nextValue = typeof updater === 'function' ? updater(prev) : updater;
      if (nextValue === prev) return prev;
      return nextValue;
    });
  }, []);

  return useMemo(
    () => ({ config, loading, error, reload, updateLocal }),
    [config, loading, error, reload, updateLocal]
  );
};

// Isolate each store in its own memoized provider so unrelated store updates do not re-render siblings
const StoreProvider = memo(function StoreProvider({ Provider, file, children }) {
  const storeState = useStoreState(file);
  return <Provider value={storeState}>{children}</Provider>;
});

export const DataProvider = ({ children }) => {
  const providers = useMemo(
    () => [
      { Provider: AppConfigContext.Provider, file: 'app-config' },
      { Provider: LoggingConfigContext.Provider, file: 'logging-config' },
      { Provider: CommandsConfigContext.Provider, file: 'commands-config' },
      { Provider: MessagesConfigContext.Provider, file: 'messages-config' },
      { Provider: TwitchAccountsConfigContext.Provider, file: 'twitch-accounts-config' },
      { Provider: KickAccountsConfigContext.Provider, file: 'kick-accounts-config' },
      { Provider: ServerConfigContext.Provider, file: 'server-config' },
      { Provider: StreamingSoftwareConfigContext.Provider, file: 'streaming-software-config' },
      { Provider: SwitcherConfigContext.Provider, file: 'switcher-config' },
      { Provider: OverlayConfigContext.Provider, file: 'overlay-config' },
      { Provider: YoutubeAccountsConfigContext.Provider, file: 'youtube-accounts-config' }
    ],
    []
  );

  return providers.reduceRight(
    (acc, { Provider, file }) => (
      <StoreProvider key={file} Provider={Provider} file={file}>
        {acc}
      </StoreProvider>
    ),
    children
  );
};

// Public hooks for each store
export const useAppConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useAppConfigInternal();
  return useMemo(
    () => ({
      appConfig: config,
      loading,
      error,
      reloadAppConfig: reload,
      updateAppConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useLoggingConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useLoggingConfigInternal();
  return useMemo(
    () => ({
      loggingConfig: config,
      loading,
      error,
      reloadLoggingConfig: reload,
      updateLoggingConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useCommandsConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useCommandsConfigInternal();
  return useMemo(
    () => ({
      commandsConfig: config,
      loading,
      error,
      reloadCommandsConfig: reload,
      updateCommandsConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useMessagesConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useMessagesConfigInternal();
  return useMemo(
    () => ({
      messagesConfig: config,
      loading,
      error,
      reloadMessagesConfig: reload,
      updateMessagesConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useTwitchAccountsConfig = () => {
  const { config, loading, error, reload, updateLocal } = useTwitchAccountsConfigInternal();
  return useMemo(
    () => ({
      twitchAccountsConfig: config,
      loading,
      error,
      reloadTwitchAccountsConfig: reload,
      updateTwitchAccountsConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useKickAccountsConfig = () => {
  const { config, loading, error, reload, updateLocal } = useKickAccountsConfigInternal();
  return useMemo(
    () => ({
      kickAccountsConfig: config,
      loading,
      error,
      reloadKickAccountsConfig: reload,
      updateKickAccountsConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useServerConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useServerConfigInternal();
  return useMemo(
    () => ({
      serverConfig: config,
      loading,
      error,
      reloadServerConfig: reload,
      updateServerConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useStreamingSoftwareConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useStreamingSoftwareConfigInternal();
  return useMemo(
    () => ({
      streamingSoftwareConfig: config,
      loading,
      error,
      reloadStreamingSoftwareConfig: reload,
      updateStreamingSoftwareConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useSwitcherConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useSwitcherConfigInternal();
  return useMemo(
    () => ({
      switcherConfig: config,
      loading,
      error,
      reloadSwitcherConfig: reload,
      updateSwitcherConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useOverlayConfigStore = () => {
  const { config, loading, error, reload, updateLocal } = useOverlayConfigInternal();
  return useMemo(
    () => ({
      overlayConfig: config,
      loading,
      error,
      reloadOverlayConfig: reload,
      updateOverlayConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

export const useYoutubeAccountsConfig = () => {
  const { config, loading, error, reload, updateLocal } = useYoutubeAccountsConfigInternal();
  return useMemo(
    () => ({
      youtubeAccountsConfig: config,
      loading,
      error,
      reloadYoutubeAccountsConfig: reload,
      updateYoutubeAccountsConfig: updateLocal
    }),
    [config, loading, error, reload, updateLocal]
  );
};

// Backwards-compat helper for debugging or boot screens if needed
// NOTE: Avoid this in performance-critical code, as it combines all stores again.
export const useAllStores = () => {
  const app = useAppConfigStore();
  const logging = useLoggingConfigStore();
  const commands = useCommandsConfigStore();
  const messages = useMessagesConfigStore();
  const twitchAccounts = useTwitchAccountsConfig();
  const kickAccounts = useKickAccountsConfig();
  const server = useServerConfigStore();
  const streaming = useStreamingSoftwareConfigStore();
  const switcher = useSwitcherConfigStore();
  const overlay = useOverlayConfigStore();
  const youtubeAccounts = useYoutubeAccountsConfig();
  return {
    appConfig: app.appConfig,
    loggingConfig: logging.loggingConfig,
    commandsConfig: commands.commandsConfig,
    messagesConfig: messages.messagesConfig,
    twitchAccountsConfig: twitchAccounts.twitchAccountsConfig,
    kickAccountsConfig: kickAccounts.kickAccountsConfig,
    serverConfig: server.serverConfig,
    streamingSoftwareConfig: streaming.streamingSoftwareConfig,
    switcherConfig: switcher.switcherConfig,
    overlayConfig: overlay.overlayConfig,
    youtubeAccountsConfig: youtubeAccounts.youtubeAccountsConfig
  };
};
