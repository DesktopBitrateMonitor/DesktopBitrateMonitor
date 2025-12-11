import { AlertProvider } from './contexts/AlertContenx.jsx';
import { ThemeModeProvider } from './contexts/ThemeContext.jsx';
import { DataProvider } from './contexts/DataContenxt.jsx';

/**
 * Root component that wraps the entire application with global providers
 * This ensures all providers are available from app startup
 *
 */
const RootProvider = ({ children }) => {
  return (
    <ThemeModeProvider>
      <AlertProvider>
        <DataProvider>{children}</DataProvider>
      </AlertProvider>
    </ThemeModeProvider>
  );
};

export default RootProvider;
