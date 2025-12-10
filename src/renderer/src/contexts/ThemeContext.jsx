import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
// Use custom theme settings provided in assets
import { themes } from '../assets/themes';
import { createMuiTheme } from '../assets/mui-themes-override';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};

export const ThemeModeProvider = ({ initialMode = 'light', children }) => {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    (async () => {
      const storedTheme = await window.storeApi.get('app-config.json', 'theme');
      if (storedTheme) setMode(storedTheme);
    })();
  }, []);

  const toggleMode = useCallback(async () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    await window.storeApi.set(
      'app-config.json',
      'theme',
      mode === 'light' ? 'dark' : 'light'
    );
  }, [mode]);

  // Build the MUI theme dynamically from user-provided theme settings
  const theme = useMemo(() => {
    const themeDef = themes[mode] || themes.light || { name: 'light' };
    return createMuiTheme(themeDef);
  }, [mode]);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
