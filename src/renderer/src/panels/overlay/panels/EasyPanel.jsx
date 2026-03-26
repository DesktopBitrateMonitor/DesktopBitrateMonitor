import { Box, Stack, Switch, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import PreviewOverlay from '../components/PreviewOverlay';
import { useTranslation } from 'react-i18next';
import { useOverlayConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';

const EasyPanel = ({ workingConfig, setWorkingConfig }) => {
  const { overlayConfig, updateOverlayConfig } = useOverlayConfigStore();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [switchStates, setSwitchStates] = useState({
    showBitrate: false,
    showSpeed: false,
    showUptime: false,
    showTotalUptime: false,
    showIcons: false
  });

  useEffect(() => {
    console.log(workingConfig);

    setSwitchStates({
      showBitrate: overlayConfig.showBitrate,
      showSpeed: overlayConfig.showSpeed,
      showUptime: overlayConfig.showUptime,
      showTotalUptime: overlayConfig.showTotalUptime,
      showIcons: overlayConfig.showIcons
    });
  }, [overlayConfig]);

  const handleSwitchChange = useCallback(
    async (key, value) => {
      updateOverlayConfig((prev) => ({
        ...prev,
        [key]: value
      }));

      const res = await window.storeApi.set('overlay-config', key, value);
      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [workingConfig, setWorkingConfig]
  );

  const SWITCHES = [
    { key: 'showBitrate', label: 'Show Bitrate', translation: 'overlayEditor.easy.showBitrate' },
    { key: 'showSpeed', label: 'Show Speed', translation: 'overlayEditor.easy.showSpeed' },
    { key: 'showUptime', label: 'Show Uptime', translation: 'overlayEditor.easy.showUptime' },
    {
      key: 'showTotalUptime',
      label: 'Show Total Uptime',
      translation: 'overlayEditor.easy.showTotalUptime'
    },
    { key: 'showIcons', label: 'Show Icons', translation: 'overlayEditor.easy.showIcons' }
  ];

  return (
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <PreviewOverlay sx={{ width: '100%', flex: 1 }} workingConfig={workingConfig} fullWidth />
      <Box>
        {SWITCHES.map((switchConfig) => (
          <Box key={switchConfig.key} sx={{ display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={switchStates[switchConfig.key] || false}
              onChange={(e) => handleSwitchChange(switchConfig.key, e.target.checked)}
            />
            <Typography variant="body2" color="textSecondary">
              {t(switchConfig.translation)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default EasyPanel;
