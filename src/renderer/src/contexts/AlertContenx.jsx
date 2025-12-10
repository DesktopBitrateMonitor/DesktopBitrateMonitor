import { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = ({
    message,
    severity = 'success', // 'success', 'info', 'warning', 'error'
    direction = 'left',
    duration = 3
  }) => {
    const id = Date.now(); // Unique identifier for each alert
    const fadeMs = 300; // fade-out duration
    const totalMs = Math.max(0, Math.floor(duration * 1000));

    // Add alert as visible
    setAlerts((prev) => [...prev, { id, message, severity, direction, visible: true }]);

    // Trigger fade-out shortly before removal
    const exitAt = Math.max(0, totalMs - fadeMs);
    if (exitAt > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, visible: false } : a)));
      }, exitAt);
    }

    // Remove the alert after the specified duration
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, totalMs || fadeMs);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const value = {
    alerts,
    showAlert,
    clearAlerts,
    removeAlert
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};
