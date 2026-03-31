import { Stack, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { useThemeMode } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '../contexts/DataContext';

const ThemeSelector = () => {
  const { t } = useTranslation();
  const { mode, toggleMode } = useThemeMode();
  const { updateAppConfig } = useAppConfigStore();

  const handleChange = (event) => {
    const nextMode = event.target.value;
    if (nextMode !== mode) toggleMode(nextMode);

    updateAppConfig((prev) => ({
      ...prev,
      theme: nextMode
    }));
  };

  return (
    <Stack m={1} direction="row" alignItems="center" spacing={1.5}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t('appSettings.style.theme.label')}</InputLabel>
        <Select value={mode} onChange={handleChange} label={t('appSettings.style.theme.label')}>
          <MenuItem value="light">{t('appSettings.style.theme.options.light')}</MenuItem>
          <MenuItem value="dark">{t('appSettings.style.theme.options.dark')}</MenuItem>
          <MenuItem value="system">{t('appSettings.style.theme.options.system')}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};

export default ThemeSelector;
