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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  const DEFAULT_SELECTED_SETTINGS = useMemo(
    () => ({
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
    }),
    []
  );

  const MAPPED_STORES = useMemo(
    () => ({
      'app-config': appConfig,
      'logging-config': loggingConfig,
      'commands-config': commandsConfig,
      'messages-config': messagesConfig,
      'twitch-accounts-config': twitchAccountsConfig,
      'kick-accounts-config': kickAccountsConfig,
      'server-config': serverConfig,
      'streaming-software-config': streamingSoftwareConfig,
      'switcher-config': switcherConfig,
      'overlay-config': overlayConfig
    }),
    [
      appConfig,
      loggingConfig,
      commandsConfig,
      messagesConfig,
      twitchAccountsConfig,
      kickAccountsConfig,
      serverConfig,
      streamingSoftwareConfig,
      switcherConfig,
      overlayConfig
    ]
  );

  const BACKUP_KEY_MAP = useMemo(
    () => ({
      'app-config': 'appConfig',
      'logging-config': 'loggingConfig',
      'commands-config': 'commandsConfig',
      'messages-config': 'messagesConfig',
      'twitch-accounts-config': 'twitchAccountsConfig',
      'kick-accounts-config': 'kickAccountsConfig',
      'server-config': 'serverConfig',
      'streaming-software-config': 'streamingSoftwareConfig',
      'switcher-config': 'switcherConfig',
      'overlay-config': 'overlayConfig'
    }),
    []
  );

  const mapBackupToSelectedSettings = useCallback(
    (backup = {}) =>
      Object.entries(BACKUP_KEY_MAP).reduce((acc, [uiKey, backupKey]) => {
        acc[uiKey] = backup?.[backupKey] ?? DEFAULT_SELECTED_SETTINGS[uiKey];
        return acc;
      }, {}),
    [BACKUP_KEY_MAP, DEFAULT_SELECTED_SETTINGS]
  );

  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState(() =>
    mapBackupToSelectedSettings(appConfig?.backup)
  );

  useEffect(() => {
    setSelectedSettings(mapBackupToSelectedSettings(appConfig?.backup));
  }, [appConfig?.backup, mapBackupToSelectedSettings]);

  const UPDATE_MAPPINGS = {
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
    { key: 'app-config', label: t('appSettings.backup.switches.appConfig'), isDev: false },
    {
      key: 'twitch-accounts-config',
      label: t('appSettings.backup.switches.twitchAccountsConfig'),
      isDev: false
    },
    {
      key: 'kick-accounts-config',
      label: t('appSettings.backup.switches.kickAccountsConfig'),
      isDev: false
    },
    {
      key: 'commands-config',
      label: t('appSettings.backup.switches.commandsConfig'),
      isDev: false
    },
    {
      key: 'messages-config',
      label: t('appSettings.backup.switches.messagesConfig'),
      isDev: false
    },
    { key: 'server-config', label: t('appSettings.backup.switches.serverConfig'), isDev: false },
    {
      key: 'streaming-software-config',
      label: t('appSettings.backup.switches.streamingSoftwareConfig'),
      isDev: false
    },
    {
      key: 'switcher-config',
      label: t('appSettings.backup.switches.switcherConfig'),
      isDev: false
    },
    { key: 'overlay-config', label: t('appSettings.backup.switches.overlayConfig'), isDev: false },
    { key: 'logging-config', label: t('appSettings.backup.switches.loggingConfig'), isDev: false }
  ];

  const handleSwitchChange = useCallback(
    async (key) => {
      const backupKey = BACKUP_KEY_MAP[key];
      if (!backupKey) return;

      const nextValue = !selectedSettings[key];
      const updatedBackup = {
        ...(appConfig?.backup ?? {}),
        [backupKey]: nextValue
      };

      const res = await window.storeApi.set('app-config', 'backup', updatedBackup);

      if (res.success) {
        setSelectedSettings((prev) => ({
          ...prev,
          [key]: nextValue
        }));

        updateAppConfig((prev) => ({
          ...(prev || {}),
          backup: updatedBackup
        }));

        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [BACKUP_KEY_MAP, appConfig?.backup, selectedSettings, showAlert, t, updateAppConfig]
  );

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

    if (!decrypted.success) {
      showAlert({ message: t('alerts.loadError'), severity: 'error' });
      return;
    }

    for (const store in decrypted.data) {
      // Skip empty objects, which means the user chose not to include that config in the backup
      if (!decrypted.data[store] || Object.keys(decrypted.data[store]).length === 0) continue;

      const mergedData = { ...MAPPED_STORES[store], ...decrypted.data[store] };

      // Update the store with the decrypted data from the backup
      await window.storeApi.set(store, '', mergedData);

      // Set the theme mode from the backup
      if (store === 'app-config' && mergedData.theme) {
        toggleMode(mergedData.theme);
      }

      // Update the store in the app state using the corresponding update function
      if (UPDATE_MAPPINGS[store]) {
        UPDATE_MAPPINGS[store](mergedData);
      }
    }

    // Restart the stats fetcher service
    await window.servicesApi.restartStatsFetcherService();

    showAlert({ message: t('alerts.loadSuccess'), severity: 'success' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <CollapsibleCard
        title={t('appSettings.backup.header')}
        subtitle={t('appSettings.backup.description')}
        collapsible={false}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            {SETTING_KEY.map((setting, index) => {
              if (setting.isDev && !isDev) return null;
              if (index > 4) return null; // Only show first 5 settings
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
              if (index < 5) return null; // Only show settings after the first 5
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
            {t('app.global.button.export')}
          </Button>
          <Button onClick={handleImport} startIcon={<CloudUpload />}>
            {t('app.global.button.import')}
          </Button>
        </Box>
      </CollapsibleCard>

      <Dialog open={openWarningDialog} onClose={() => setOpenWarningDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Warning color="warning" sx={{ fontSize: 32 }} />
            <Typography variant="h6" component="span" ml={1}>
              {t('appSettings.backup.dialog.header')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t('appSettings.backup.dialog.message')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWarningDialog(false)}>
            {t('app.global.button.cancel')}
          </Button>
          <Button
            onClick={() => {
              handleExport();
              setOpenWarningDialog(false);
            }}
            color="error"
          >
            {t('app.global.button.exportAnyway')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Backup;
