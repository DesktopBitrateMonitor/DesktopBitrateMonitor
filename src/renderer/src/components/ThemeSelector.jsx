import { Stack, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { useThemeMode } from '../contexts/ThemeContext';

const ThemeSelector = () => {
  const { mode, toggleMode } = useThemeMode();

  const handleChange = (event) => {
    const nextMode = event.target.value;
    if (nextMode !== mode) toggleMode();
  };

  return (
    <Stack m={1} direction="row" alignItems="center" spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Theme
      </Typography>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select value={mode} onChange={handleChange} aria-label="Select theme mode">
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};

export default ThemeSelector;
