import { Box, MenuItem, Select, Stack, Switch, Typography } from '@mui/material';
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

  const [simpleLayoutProps, setSimpleLayoutProps] = useState({
    direction: 'row',
    gap: 8
  });

  useEffect(() => {
    setSwitchStates({
      showBitrate: overlayConfig.showBitrate,
      showSpeed: overlayConfig.showSpeed,
      showUptime: overlayConfig.showUptime,
      showTotalUptime: overlayConfig.showTotalUptime,
      showIcons: overlayConfig.showIcons
    });
  }, [overlayConfig]);

  useEffect(() => {
    setSimpleLayoutProps(workingConfig.props || {});
  }, [workingConfig]);

  const handleSelectChange = useCallback(
    async (key, value) => {
      setWorkingConfig((prev) => ({
        ...prev,
        props: {
          ...prev.props,
          [key]: value
        }
      }));

      const res = await window.storeApi.set('overlay-config', `overlay.easy.props[${key}]`, value);
      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [setWorkingConfig]
  );

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

  const handleHtmlLayoutChange = () => {};

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
        <Select
          onChange={(e) => handleSelectChange('direction', e.target.value)}
          value={simpleLayoutProps.direction || ''}
        >
          <MenuItem value={'row'}>{t('overlayEditor.easy.select.row')}</MenuItem>
          <MenuItem value={'column'}>{t('overlayEditor.easy.select.column')}</MenuItem>
        </Select>
      </Box>
    </Box>
  );
};

export default EasyPanel;
