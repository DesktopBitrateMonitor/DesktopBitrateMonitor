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
          message: t('alerts.saveSuccess'),
          severity: 'info'
        });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [t, updateAppConfig]
  );

  const handleSelectChange = useCallback(
    async (event) => {
      const newLanguage = event.target.value;
      const result = await changeLanguage(newLanguage);

      if (result.success) {
        showAlert({
          message: t('alerts.saveSuccess'),
          severity: 'success'
        });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [changeLanguage, showAlert, supportedLanguages, t]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CollapsibleCard
        title={t('appSettings.general.header')}
        subtitle={t('appSettings.general.description')}
        collapsible={false}
        // actions={
        //   <TextField
        //     label={t('appSettings.general.search')}
        //     value={searchTerm}
        //     onChange={(event) => setSearchTerm(event.target.value)}
        //     slotProps={{
        //       input: {
        //         endAdornment: <Search />
        //       }
        //     }}
        //   />
        // }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <FormControl size="small" sx={{ width: '180px' }}>
              <InputLabel>{t('appSettings.general.language.select.label')}</InputLabel>
              <Select
                label={t('appSettings.general.language.select.label')}
                onChange={handleSelectChange}
                value={language}
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {t(`appSettings.general.language.select.options.${lang.code}`, {
                      fallback: lang.label
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body1">{t('appSettings.general.quitState.label')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Switch
                checked={appConfig.onQuit === 'quit' ? true : false}
                onChange={handleSwitchChange}
              />
              <Typography variant="body2" color="text.secondary">
                {t(`appSettings.general.quitState.${appConfig.onQuit}`)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CollapsibleCard>
    </Box>
  );
};

export default GeneralSettings;
