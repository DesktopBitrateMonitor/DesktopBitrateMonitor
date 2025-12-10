import { createTheme } from '@mui/material/styles';

export const createMuiTheme = (mode) => {
  const isLight = mode.name === 'light';

  // Basic theme setup
  return createTheme({
    // Mui theme palettte
    palette: {
      mode: isLight ? 'light' : 'dark'
    },
    // Default MUI components theming props
    components: {
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
        }
      }
    }
  });
};
