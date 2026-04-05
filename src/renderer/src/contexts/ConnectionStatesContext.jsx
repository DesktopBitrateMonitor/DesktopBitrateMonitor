import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const ConnectionStatesContext = createContext(null);
ConnectionStatesContext.displayName = 'ConnectionStatesContext';

const initialState = {
  statuses: {
    server: 'unknown',
    chat: 'unknown',
    software: 'unknown',
    feed: 'unknown'
  },
  serverType: null,
  softwareType: null,
  broadcastState: false,
  incomingPublisher: null,
  storedPublisher: ''
};

const setStatus = (statuses, key, value) => ({
  ...(statuses || {}),
  [key]: value
});

function reducer(state, action) {
  switch (action.type) {
    case 'server:update': {
      const { success, serverType, storedPublisher, incomingPublisher } = action.payload;
      return {
        ...state,
        statuses: setStatus(state.statuses, 'server', success ? 'connected' : 'disconnected'),
        serverType: success ? (serverType ?? null) : null,
        storedPublisher: success ? (storedPublisher ?? '') : '',
        incomingPublisher: success ? (incomingPublisher ?? null) : null
      };
    }

    case 'software:update': {
      const { status, softwareType, outputActive } = action.payload;
      if (status === 'connected') {
        return {
          ...state,
          statuses: setStatus(state.statuses, 'software', 'connected'),
          softwareType: softwareType ?? null,
          broadcastState: Boolean(outputActive)
        };
      }

      if (status === 'disconnected') {
        return {
          ...state,
          statuses: setStatus(state.statuses, 'software', 'disconnected'),
          softwareType: null,
          broadcastState: false
        };
      }

      return {
        ...state,
        statuses: setStatus(state.statuses, 'software', 'unknown'),
        softwareType: null,
        broadcastState: false
      };
    }

    case 'twitch:update': {
      const { success } = action.payload;
      return {
        ...state,
        statuses: setStatus(state.statuses, 'chat', success ? 'connected' : 'disconnected')
      };
    }

    case 'counter:update': {
      const { changesToLow, changesToLive, changesToOffline } = action.payload;
      return {
        ...state,
        switcherCounters: {
          changesToLow,
          changesToLive,
          changesToOffline
        }
      };
    }

    default:
      return state;
  }
}

/**
 * Listener factory shape:
 * - key: string (for debugging)
 * - subscribe: ({ api, dispatch }) => unsubscribe?
 */
export const DEFAULT_CONNECTION_LISTENERS = [
  {
    key: 'server-connected',
    subscribe: ({ api, dispatch }) =>
      api.serverConnected((response = {}) => {
        const success = Boolean(response?.success);
        const publishers = response?.data?.publishers;
        const serverType = response?.server ?? 'unknown';
        let publisherKeys = [];
        if (serverType !== 'nginx-rtmp') {
          publisherKeys =
            publishers && typeof publishers === 'object' ? Object.keys(publishers) : [];
        } else {
          publisherKeys.push(response?.publisher);
        }
        dispatch({
          type: 'server:update',
          payload: {
            success,
            serverType: response?.server,
            storedPublisher: response?.storedPublisher,
            incomingPublisher: publisherKeys.length > 0 ? publisherKeys[0] : null
          }
        });
      })
  },
  {
    key: 'streaming-software',
    subscribe: ({ api, dispatch }) =>
      api.streamingSoftwareConnected((response = {}) => {
        const success = Boolean(response?.success);
        const status = success ? response?.status : 'unknown';
        const data = response?.data ?? {};

        dispatch({
          type: 'software:update',
          payload: {
            status,
            softwareType: response?.softwareType,
            outputActive: data && typeof data === 'object' ? data.outputActive : undefined
          }
        });
      })
  },
  {
    key: 'twitch-eventsub',
    subscribe: ({ api, dispatch }) =>
      api.twitchEventSubConnected((response = {}) => {
        dispatch({ type: 'twitch:update', payload: { success: Boolean(response?.success) } });
      })
  },
  {
    key: 'switch-counter-update',
    subscribe: ({ api, dispatch }) =>
      api.switchCounterUpdate((response = {}) => {
        const { changesToLow, changesToLive, changesToOffline } = response;
        dispatch({
          type: 'counter:update',
          payload: {
            changesToLow: Number.isInteger(changesToLow) ? changesToLow : 0,
            changesToLive: Number.isInteger(changesToLive) ? changesToLive : 0,
            changesToOffline: Number.isInteger(changesToOffline) ? changesToOffline : 0
          }
        });
      })
  }
];

export const ConnectionStatesProvider = ({
  children,
  listeners = DEFAULT_CONNECTION_LISTENERS
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const api = window?.statesApi;
    if (!api) return undefined;

    const unsubs = (listeners || []).map((listener) => {
      try {
        return listener?.subscribe?.({ api, dispatch });
      } catch (error) {
        console.error(`Connection listener failed: ${listener?.key || 'unknown'}`, error);
        return undefined;
      }
    });

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub?.();
        } catch (error) {
          console.error('Connection listener cleanup failed', error);
        }
      });
    };
  }, [listeners]);

  const value = useMemo(() => {
    const incoming = state.incomingPublisher;
    const stored = state.storedPublisher;

    const feedStatus =
      incoming === stored ? 'connected' : !incoming || !stored ? 'unknown' : 'asynchronous';

    return {
      ...state,
      feedStatus
    };
  }, [state]);

  return (
    <ConnectionStatesContext.Provider value={value}>{children}</ConnectionStatesContext.Provider>
  );
};

export const useConnectionStates = () => {
  const ctx = useContext(ConnectionStatesContext);
  if (!ctx) throw new Error('useConnectionStates must be used within ConnectionStatesProvider');
  return ctx;
};
