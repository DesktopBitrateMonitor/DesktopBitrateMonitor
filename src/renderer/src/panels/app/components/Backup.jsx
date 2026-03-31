import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { CloudDownload, CloudUpload, Warning } from '@mui/icons-material';
import {
  useAppConfigStore,
  useCommandsConfigStore,
  useKickAccountsConfig,
  useLoggingConfigStore,
  useMessagesConfigStore,
  useOverlayConfigStore,
  useServerConfigStore,
  useStreamingSoftwareConfigStore,
  useSwitcherConfigStore,
  useTwitchAccountsConfig
} from '../../../contexts/DataContext';
import { parseBackupData, stringifyBackupData, timestamp } from '../../../scripts/lib';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../../contexts/AlertContext';
import { useThemeMode } from '../../../contexts/ThemeContext';

const isDev = import.meta.env.DEV;

const Backup = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { loggingConfig, updateLoggingConfig } = useLoggingConfigStore();
  const { commandsConfig, updateCommandsConfig } = useCommandsConfigStore();
  const { messagesConfig, updateMessagesConfig } = useMessagesConfigStore();
  const { twitchAccountsConfig, updateTwitchAccountsConfig } = useTwitchAccountsConfig();
  const { kickAccountsConfig, updateKickAccountsConfig } = useKickAccountsConfig();
  const { serverConfig, updateServerConfig } = useServerConfigStore();
  const { streamingSoftwareConfig, updateStreamingSoftwareConfig } =
    useStreamingSoftwareConfigStore();
  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const { overlayConfig, updateOverlayConfig } = useOverlayConfigStore();
  const { toggleMode } = useThemeMode();

  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState({
    'app-config': true,
    'logging-config': false,
    'commands-config': true,
    'messages-config': true,
    'twitch-accounts-config': true,
    'kick-accounts-config': true,
    'server-config': true,
    'streaming-software-config': true,
    'switcher-config': true,
    'overlay-config': true
  });

  const UPDATE_MAPINGS = {
    'app-config': updateAppConfig,
    'logging-config': updateLoggingConfig,
    'commands-config': updateCommandsConfig,
    'messages-config': updateMessagesConfig,
    'twitch-accounts-config': updateTwitchAccountsConfig,
    'kick-accounts-config': updateKickAccountsConfig,
    'server-config': updateServerConfig,
    'streaming-software-config': updateStreamingSoftwareConfig,
    'switcher-config': updateSwitcherConfig,
    'overlay-config': updateOverlayConfig
  };

  const SETTING_KEY = [
    { key: 'app-config', label: 'App Config', isDev: false },
    { key: 'logging-config', label: 'Logging Config', isDev: true },
    { key: 'commands-config', label: 'Commands Config', isDev: false },
    { key: 'messages-config', label: 'Messages Config', isDev: false },
    { key: 'twitch-accounts-config', label: 'Twitch Accounts Config', isDev: false },
    { key: 'kick-accounts-config', label: 'Kick Accounts Config', isDev: false },
    { key: 'server-config', label: 'Server Config', isDev: false },
    { key: 'streaming-software-config', label: 'Streaming Software Config', isDev: false },
    { key: 'switcher-config', label: 'Switcher Config', isDev: false },
    { key: 'overlay-config', label: 'Overlay Config', isDev: false }
  ];

  const handleSwitchChange = (key) => {
    setSelectedSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExport = async () => {
    const selectedData = {
      'app-config': selectedSettings['app-config'] ? appConfig : null,
      'logging-config': selectedSettings['logging-config'] ? loggingConfig : null,
      'commands-config': selectedSettings['commands-config'] ? commandsConfig : null,
      'messages-config': selectedSettings['messages-config'] ? messagesConfig : null,
      'twitch-accounts-config': selectedSettings['twitch-accounts-config']
        ? twitchAccountsConfig
        : null,
      'kick-accounts-config': selectedSettings['kick-accounts-config'] ? kickAccountsConfig : null,
      'server-config': selectedSettings['server-config'] ? serverConfig : null,
      'streaming-software-config': selectedSettings['streaming-software-config']
        ? streamingSoftwareConfig
        : null,
      'switcher-config': selectedSettings['switcher-config'] ? switcherConfig : null,
      'overlay-config': selectedSettings['overlay-config'] ? overlayConfig : null
    };

    const res = await stringifyBackupData(selectedData);

    const options = {
      title: 'Save Backup',
      defaultPath: `dbm-backup-${timestamp()}.txt`,
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    };

    const saveRes = await window.servicesApi.saveBackup(res, options);

    if (!saveRes.success) {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
      return;
    }

    showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
  };

  const handleImport = async () => {
    const options = {
      title: 'Load Backup',
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
      properties: ['openFile']
    };
    const loadRes = await window.servicesApi.loadBackup(options);

    if (!loadRes.success) {
      showAlert({ message: t('alerts.loadError'), severity: 'error' });
      return;
    }

    const decrypted = await parseBackupData(loadRes.data);

    for (const store in decrypted) {
      if (!decrypted[store] || Object.keys(decrypted[store]).length === 0) continue; // Skip empty objects, which means the user chose not to include that config in the backup

      // Update the store with the decrypted data from the backup
      await window.storeApi.set(store, '', decrypted[store]);

      // Set the theme mode from the backup
      if (store === 'app-config' && decrypted[store].theme) {
        toggleMode(decrypted[store].theme);
      }

      // Update the store in the app state using the corresponding update function
      if (UPDATE_MAPINGS[store]) {
        UPDATE_MAPINGS[store](decrypted[store]);
      }
    }
    showAlert({ message: t('alerts.loadSuccess'), severity: 'success' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CollapsibleCard
        title={'Import/Export'}
        subtitle={'Choose the data you want to import or backup'}
        collapsible={false}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            {SETTING_KEY.map((setting, index) => {
              if (setting.isDev && !isDev) return null;
              if (index > 4) return null; // Only show first 5 settings for now, can be removed later
              return (
                <Box key={setting.key}>
                  <Switch
                    checked={selectedSettings[setting.key]}
                    onChange={() => handleSwitchChange(setting.key)}
                  />
                  <Typography variant="body2" component="span">
                    {setting.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Box>
            {SETTING_KEY.map((setting, index) => {
              if (setting.isDev && !isDev) return null;
              if (index < 5) return null; // Only show settings after the first 5, can be removed later
              return (
                <Box key={setting.key}>
                  <Switch
                    checked={selectedSettings[setting.key]}
                    onChange={() => handleSwitchChange(setting.key)}
                  />
                  <Typography variant="body2" component="span">
                    {setting.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }} p={2}>
          <Button
            onClick={() => {
              if (
                selectedSettings['twitch-accounts-config'] ||
                selectedSettings['kick-accounts-config']
              ) {
                setOpenWarningDialog(true);
              } else {
                handleExport();
              }
            }}
            startIcon={<CloudDownload />}
          >
            Export
          </Button>
          <Button onClick={handleImport} startIcon={<CloudUpload />}>
            Import
          </Button>
        </Box>
      </CollapsibleCard>

      <Dialog open={openWarningDialog} onClose={() => setOpenWarningDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6" component="span" ml={1}>
              Warning: Sensitive Data Included
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You have selected to include your Twitch or Kick accounts config in the backup. This
            will include sensitive information such as your access tokens. Make sure to keep the
            backup file safe and do not share it with anyone you do not trust. Are you sure you want
            to export the backup with the sensitive account data?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWarningDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleExport();
              setOpenWarningDialog(false);
            }}
            color="error"
          >
            Export Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Backup;
