import React from 'react';
import { useAppConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import { Box, Button, Stack, Switch, Typography } from '@mui/material';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import SyncIcon from '@mui/icons-material/Sync';

const SWITCH_MAPPINGS = {
  autoCheckForUpdates: 'Auto-check for updates',
  autoInstallUpdates: 'Auto-install updates',
  installOnQuit: 'Install updates on quit',
  installOnStart: 'Install updates on start'
};

const UpdateSettings = () => {
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { showAlert } = useAlert();

  const [updateData, setUpdateData] = React.useState({
    autoCheckForUpdates: appConfig.autoCheckForUpdates,
    autoInstallUpdates: appConfig.autoInstallUpdates,
    installOnQuit: appConfig.installOnQuit,
    installOnStart: appConfig.installOnStart
  });

  const handleSwitchChange = async (key, value) => {
    const res = await window.storeApi.set('app-config', key, value);

    if (res.success) {
      showAlert({
        message: `${SWITCH_MAPPINGS[key]} updated successfully`,
        severity: 'success'
      });
    } else {
      showAlert({
        message: `Failed to update ${SWITCH_MAPPINGS[key]}`,
        severity: 'error'
      });
    }
    setUpdateData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUniqueSwitchChange = async (key, value) => {
    if (key === 'installOnStart') {
      // If enabling installOnStart, disable installOnQuit
      setUpdateData((prev) => ({
        ...prev,
        installOnQuit: !value,
        installOnStart: value
      }));

      updateAppConfig((prev) => ({
        ...(prev || {}),
        installOnQuit: !value,
        installOnStart: value
      }));
    }
    if (key === 'installOnQuit') {
      setUpdateData((prev) => ({
        ...prev,
        installOnQuit: value,
        installOnStart: !value
      }));

      updateAppConfig((prev) => ({
        ...(prev || {}),
        installOnStart: !value,
        installOnQuit: value
      }));
    }
    const [res1, res2] = await Promise.all([
      window.storeApi.set('app-config', 'installOnQuit', key === 'installOnQuit' ? value : !value),
      window.storeApi.set('app-config', 'installOnStart', key === 'installOnStart' ? value : !value)
    ]);

    if (res1.success && res2.success) {
      showAlert({
        message: `Update settings updated successfully`,
        severity: 'success'
      });
    } else {
      showAlert({
        message: `Failed to update update settings`,
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <CollapsibleCard
        title="Update Settings"
        subtitle="Manage application update settings"
        defaultExpanded={true}
        collapsible={false}
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
              {SWITCH_MAPPINGS.autoCheckForUpdates}
            </Typography>
            {!updateData.autoCheckForUpdates && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  ml: 2
                }}
              >
                <Button
                  onClick={() => {
                    // TODO: Implement manual checks for updates
                    console.log('Implement manual Update check');
                    console.log(new Date().toLocaleString());
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ ml: 2 }}
                >
                  <SyncIcon fontSize="small" />
                </Button>
                <Typography ml={-2} variant="caption" color="text.secondary">
                  {`Last Check: ${updateData.lastUpdateCheck ? new Date(updateData.lastUpdateCheck).toLocaleString() : 'Never'}`}
                </Typography>
              </Box>
            )}
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
            {SWITCH_MAPPINGS.autoInstallUpdates}
          </Typography>
        </Box>

        <Box key={'installOnQuit'}>
          <Switch
            checked={updateData.installOnQuit}
            onChange={(e) => {
              handleUniqueSwitchChange('installOnQuit', e.target.checked);
            }}
          />
          <Typography variant="body2" component="span">
            {SWITCH_MAPPINGS.installOnQuit}
          </Typography>
        </Box>

        <Box key={'installOnStart'}>
          <Switch
            checked={updateData.installOnStart}
            onChange={(e) => {
              handleUniqueSwitchChange('installOnStart', e.target.checked);
            }}
          />
          <Typography variant="body2" component="span">
            {SWITCH_MAPPINGS.installOnStart}
          </Typography>
        </Box>
      </CollapsibleCard>
    </Box>
  );
};

export default UpdateSettings;
