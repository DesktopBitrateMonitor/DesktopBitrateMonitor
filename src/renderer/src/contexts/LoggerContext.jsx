import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import generateId from '../../../scripts/lib/id-generator';

const LoggerContext = createContext(null);
LoggerContext.displayName = 'LoggerContext';

const MAX_LOGS = 1000;

const normalizeLog = (log, source = 'backend') => {
  const message = typeof log === 'string' ? log : (log?.message ?? '');
  const type = log?.type || 'log';
  const timestamp = log?.timestamp || new Date().toISOString();

  return {
    id: generateId(32),
    type,
    message,
    timestamp,
    source
  };
};

export const LoggerProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const mountedRef = useRef(false);

  const appendLog = useCallback((log, source = 'backend') => {
    setLogs((prev) => {
      const next = [...prev, normalizeLog(log, source)];
      return next.slice(-MAX_LOGS);
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    mountedRef.current = true;
    const api = window?.loggerApi;

    if (!api?.newLogEvent) return undefined;

    let lastMessage;

    const unsubscribe = api.newLogEvent((log) => {
      if (!mountedRef.current) return;

      if (log.message === lastMessage) return;
      appendLog(log, 'backend');
      lastMessage = log?.message;
    });

    return () => {
      mountedRef.current = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else {
        api.removeLogEvent?.();
      }
    };
  }, [appendLog]);

  const value = useMemo(
    () => ({
      logs,
      appendLog,
      clearLogs,
      addFrontendLog: (log) => appendLog(log, 'frontend')
    }),
    [logs, appendLog, clearLogs]
  );

  return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>;
};

export const useLogger = () => {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error('useLogger must be used within a LoggerProvider');
  return ctx;
};

export const useLoggerSafe = () => useContext(LoggerContext);
