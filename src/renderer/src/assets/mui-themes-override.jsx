import { alpha, createTheme } from '@mui/material/styles';

export const createMuiTheme = (themeDef) => {
  const isLight = themeDef.name === 'light';
  const colors = themeDef.colors || {};

  // Build palette using semantic color tokens from theme definition
  return createTheme({
    palette: {
      mode: isLight ? 'light' : 'dark',
      primary: { main: colors.primary || '#6366F1' },
      secondary: { main: colors.secondary || '#06B6D4' },
      background: {
        default: colors.background || (isLight ? '#F8FAFC' : '#0F172A'),
        paper: colors.surface || (isLight ? '#FFFFFF' : '#1E293B')
      },
      text: {
        primary: colors.textPrimary || (isLight ? '#0F172A' : '#F8FAFC'),
        secondary: colors.textSecondary || colors.muted || (isLight ? '#475569' : '#94A3B8')
      },
      divider: colors.muted || (isLight ? '#CBD5F5' : '#94A3B8')
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background || (isLight ? '#F8FAFC' : '#0F172A'),
            color: colors.textPrimary || (isLight ? '#0F172A' : '#F8FAFC')
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.surface || (isLight ? '#FFFFFF' : '#1E293B')
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? '' : alpha('#6366F1', 0.25)
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small'
        }
      },
      MuiButton: {
        defaultProps: {
          variant: 'contained',
          size: 'small'
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            boxShadow: 'none'
          }
        }
      },
      MuiSelect: {
        defaultProps: {
          size: 'small'
        }
      }
    }
  });
};
