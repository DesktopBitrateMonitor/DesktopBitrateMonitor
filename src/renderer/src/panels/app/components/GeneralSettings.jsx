import { Search } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
import { useAppConfigStore } from '../../../contexts/DataContext';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';

const GeneralSettings = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { appConfig, updateAppConfig } = useAppConfigStore();

  const { showAlert } = useAlert();
  const { language, supportedLanguages, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleSwitchChange = useCallback(
    async (event) => {
      const isChecked = event.target.checked;
      const newValue = isChecked ? 'quit' : 'minimize';
      updateAppConfig((prev) => ({ ...(prev || {}), onQuit: newValue }));

      const res = await window.storeApi.set('app-config', 'onQuit', newValue);

      if (res.success) {
        showAlert({
          message: t('generalSettings.quitMessage', {
            action: t(`generalSettings.actions.${isChecked ? 'quit' : 'minimize'}`)
          }),
          severity: 'info'
        });
      } else {
        showAlert({ message: t('generalSettings.updateError'), severity: 'error' });
      }
    },
    [t, updateAppConfig]
  );

  const handleSelectChange = useCallback(
    async (event) => {
      const newLanguage = event.target.value;
      const result = await changeLanguage(newLanguage);

      if (result.success) {
        const fallbackLabel =
          result.meta?.label ||
          supportedLanguages.find((lang) => lang.code === newLanguage)?.label ||
          newLanguage;

        showAlert({
          message: t('generalSettings.languageChanged', { language: fallbackLabel }),
          severity: 'success'
        });
      } else {
        showAlert({ message: t('generalSettings.languageError'), severity: 'error' });
      }
    },
    [changeLanguage, showAlert, supportedLanguages, t]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CollapsibleCard
        title={t('generalSettings.title')}
        subtitle={t('generalSettings.subtitle')}
        collapsible={false}
        actions={
          <TextField
            label={t('generalSettings.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            slotProps={{
              input: {
                endAdornment: <Search />
              }
            }}
          />
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <FormControl size="small" sx={{ width: '180px' }}>
              <InputLabel>{t('generalSettings.languageLabel')}</InputLabel>
              <Select
                label={t('generalSettings.languageLabel')}
                onChange={handleSelectChange}
                value={language}
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body1">{t('generalSettings.quitLabel')}</Typography>
            <Switch
              checked={appConfig.onQuit === 'quit' ? true : false}
              onChange={handleSwitchChange}
            />
          </Box>
        </Box>
      </CollapsibleCard>
    </Box>
  );
};

export default GeneralSettings;
