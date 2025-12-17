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

export const ThemeModeProvider = ({ initialMode = 'system', children }) => {
  const [mode, setMode] = useState(initialMode); // 'light' | 'dark' | 'system'
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    (async () => {
      const storedTheme = await window.storeApi.get('app-config.json', 'theme');
      if (storedTheme) setMode(storedTheme);
    })();
  }, []);

  const toggleMode = useCallback(
    async (newMode) => {
      if (!newMode) return;
      setMode(newMode);
      console.log('Setting theme mode to:', newMode);
      await window.storeApi.set('app-config.json', 'theme', newMode);
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    // Only listen for changes when following system
    if (mode === 'system') {
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      if (mode === 'system') {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [mode]);

  const resolvedMode = useMemo(
    () => (mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode),
    [mode, systemPrefersDark]
  );
  // Build the MUI theme dynamically from user-provided theme settings
  const theme = useMemo(() => {
    const themeDef = themes[resolvedMode] || themes.light || { name: 'light' };
    return createMuiTheme(themeDef);
  }, [resolvedMode]);

  const value = useMemo(() => ({ mode, resolvedMode, toggleMode }), [mode, resolvedMode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
