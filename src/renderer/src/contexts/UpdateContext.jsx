import React from 'react';
import Logger from '../../../scripts/logging/logger';

const UpdateContext = React.createContext(null);
UpdateContext.displayName = 'UpdateContext';

const initialUpdateState = { status: 'idle', data: null };
const defaultContextValue = { ...initialUpdateState, startUpdate: () => {} };

export const UpdateProvider = ({ children }) => {
  const [updateState, setUpdateState] = React.useState(initialUpdateState);

  React.useEffect(() => {
    window.updateApi.onUpdateWatcher((payload) => {
      if (!payload || !payload.status) return;
      setUpdateState({ status: payload.status, data: payload.data ?? null });

      Logger.info(`Received update state from main process: ${JSON.stringify(payload)}`);
    });
  }, []);

  const startUpdate = React.useCallback(() => {
    window.updateApi.startUpdate();
  }, []);

  const setExampleData = React.useCallback((status, data) => {
    setUpdateState({
      status: status || 'idle',
      data: data ?? null
    });
  }, []);

  const value = React.useMemo(
    () => ({
      status: updateState.status,
      data: updateState.data,
      startUpdate,
      setExampleData
    }),
    [updateState, startUpdate, setExampleData]
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
};

export const useUpdate = () => React.useContext(UpdateContext) ?? defaultContextValue;
