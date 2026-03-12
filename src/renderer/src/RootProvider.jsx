import { AlertProvider } from './contexts/AlertContext.jsx';
import { ThemeModeProvider } from './contexts/ThemeContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { ConnectionStatesProvider } from './contexts/ConnectionStatesContext.jsx';
import { UpdateProvider } from './contexts/UpdateContext.jsx';

/**
 * Root component that wraps the entire application with global providers
 * This ensures all providers are available from app startup
 *
 */
const RootProvider = ({ children }) => {
  return (
    <ThemeModeProvider>
      <AlertProvider>
        <UpdateProvider>
          <DataProvider>
            <ConnectionStatesProvider>
              <LanguageProvider>{children}</LanguageProvider>
            </ConnectionStatesProvider>
          </DataProvider>
        </UpdateProvider>
      </AlertProvider>
    </ThemeModeProvider>
  );
};

export default RootProvider;
