import React from 'react';

const UpdateContext = React.createContext(null);
UpdateContext.displayName = 'UpdateContext';

const initialUpdateState = { status: 'idle', data: null };
const defaultContextValue = { ...initialUpdateState, startUpdate: () => {} };

export const UpdateProvider = ({ children }) => {
  const [updateState, setUpdateState] = React.useState(initialUpdateState);

  React.useEffect(() => {
    if (!window.updateApi?.onUpdateWatcher) return undefined;

    const unsubscribe = window.updateApi.onUpdateWatcher((payload) => {
      if (!payload || !payload.status) return;
      setUpdateState({ status: payload.status, data: payload.data ?? null });
    });

    return unsubscribe;
  }, []);

  const startUpdate = React.useCallback(() => {
    window.updateApi?.startUpdate?.();
  }, []);

  const value = React.useMemo(
    () => ({
      status: updateState.status,
      data: updateState.data,
      startUpdate
    }),
    [updateState, startUpdate]
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
};

export const useUpdate = () => React.useContext(UpdateContext) ?? defaultContextValue;
