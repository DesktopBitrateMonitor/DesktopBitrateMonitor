import React, { useCallback, useState } from 'react';
import { useAppConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import { Box, Button, Stack, Switch, Typography } from '@mui/material';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import SyncIcon from '@mui/icons-material/Sync';
import { useTranslation } from 'react-i18next';

const UpdateSettings = ({ setOpenUpdateCard }) => {
  const { t } = useTranslation();

  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { showAlert } = useAlert();

  const [updateData, setUpdateData] = useState({
    autoCheckForUpdates: appConfig.autoCheckForUpdates,
    autoInstallUpdates: appConfig.autoInstallUpdates,
    installOnQuit: appConfig.installOnQuit,
    lastUpdateCheck: appConfig.lastUpdateCheck
  });

  const handleSwitchChange = useCallback(
    async (key, value) => {
      const res = await window.storeApi.set('app-config', key, value);

      if (res.success) {
        updateAppConfig((prev) => ({
          ...prev,
          [key]: value
        }));
        setUpdateData((prev) => ({
          ...prev,
          [key]: value
        }));
        showAlert({
          message: t('alerts.saveSuccess'),
          severity: 'success'
        });
      } else {
        showAlert({
          message: t('alerts.saveError'),
          severity: 'error'
        });
      }
    },
    [showAlert, updateAppConfig]
  );

  const handleManualUpdateCheck = async () => {
    await window.updateApi.checkForUpdates();
    const now = new Date().toISOString();
    setUpdateData((prev) => ({
      ...prev,
      lastUpdateCheck: now
    }));
    updateAppConfig((prev) => ({
      ...prev,
      lastUpdateCheck: now
    }));
    setOpenUpdateCard(true);
  };

  const openReleaseNotes = async () => {
    const url = `https://github.com/yinks87/desktop-bitrate-monitor/releases/`;
    await window.updateApi.openExternal(url);
  };

  return (
    <Box>
      <CollapsibleCard
        title={t('appSettings.update.settings.header')}
        subtitle={t('appSettings.update.settings.description')}
        defaultExpanded={true}
        collapsible={false}
        actions={
          <Box>
            <Button variant="outlined" onClick={() => openReleaseNotes()}>
              {t('appSettings.update.settings.viewReleaseNotes')}
            </Button>
          </Box>
        }
      >
        <Box key={'autoCheckForUpdates'}>
          <Stack direction={'row'} alignItems={'center'}>
            <Switch
              checked={updateData.autoCheckForUpdates}
              onChange={(e) => {
                handleSwitchChange('autoCheckForUpdates', e.target.checked);
              }}
            />
            <Typography variant="body2" component="span">
              {t('appSettings.update.settings.autoCheckForUpdates')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                ml: 2
              }}
            >
              <Button
                onClick={handleManualUpdateCheck}
                variant="outlined"
                size="small"
                sx={{ ml: 2 }}
              >
                <SyncIcon fontSize="small" />
              </Button>
              <Typography ml={-2} variant="caption" color="text.secondary">
                {`${t('appSettings.update.settings.lastCheck', { timestamp: updateData.lastUpdateCheck ? new Date(updateData.lastUpdateCheck).toLocaleString() : t('appSettings.update.settings.never') })}`}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box key={'autoInstallUpdates'}>
          <Switch
            checked={updateData.autoInstallUpdates}
            onChange={(e) => {
              handleSwitchChange('autoInstallUpdates', e.target.checked);
            }}
          />
          <Typography variant="body2" component="span">
            {t('appSettings.update.settings.autoInstallUpdates')}
          </Typography>
        </Box>
      </CollapsibleCard>
    </Box>
  );
};

export default UpdateSettings;
