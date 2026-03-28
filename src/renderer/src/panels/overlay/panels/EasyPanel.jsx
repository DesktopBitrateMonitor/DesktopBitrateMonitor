import { Box, MenuItem, Select, Slider, Stack, Switch, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PreviewOverlay from '../components/PreviewOverlay';
import { useTranslation } from 'react-i18next';
import { useOverlayConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import { MuiColorInput } from 'mui-color-input';

const EasyPanel = ({ workingConfig, setWorkingConfig }) => {
  const { overlayConfig, updateOverlayConfig } = useOverlayConfigStore();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [switchStates, setSwitchStates] = useState({
    showBitrate: false,
    showSpeed: false,
    showUptime: false,
    showIcons: false
  });

  const [simpleLayoutData, setSimpleLayoutData] = useState({
    direction: 'row',
    gap: '8'
  });

  const colorSaveTimeout = useRef(null);

  useEffect(() => {
    setSwitchStates({
      showBitrate: overlayConfig.showBitrate,
      showSpeed: overlayConfig.showSpeed,
      showUptime: overlayConfig.showUptime,
      showIcons: overlayConfig.showIcons
    });
  }, [overlayConfig]);

  useEffect(() => {
    setSimpleLayoutData(workingConfig.data || {});
  }, [workingConfig]);

  const handleSelectChange = useCallback(
    async (key, value) => {
      setWorkingConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [key]: value
        }
      }));

      const res = await window.storeApi.set('overlay-config', `overlay.easy.data.${key}`, value);
      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [setWorkingConfig]
  );

  const handleSliderInputChange = useCallback((key, value) => {
    setSimpleLayoutData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSliderChangeCommitted = useCallback(
    async (key, value) => {
      setWorkingConfig((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
      setSimpleLayoutData((prev) => ({ ...prev, [key]: value }));

      const res = await window.storeApi.set('overlay-config', `overlay.easy.data.${key}`, value);
      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [setWorkingConfig]
  );

  const handleColorChange = useCallback(
    (key, value) => {
      setWorkingConfig((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));

      if (colorSaveTimeout.current) {
        clearTimeout(colorSaveTimeout.current);
      }

      colorSaveTimeout.current = setTimeout(async () => {
        const res = await window.storeApi.set('overlay-config', `overlay.easy.data.${key}`, value);
        if (res.success) {
          showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
        } else {
          showAlert({ message: t('alerts.saveError'), severity: 'error' });
        }
      }, 500);
    },
    [setWorkingConfig, showAlert, t]
  );

  useEffect(() => {
    return () => {
      if (colorSaveTimeout.current) {
        clearTimeout(colorSaveTimeout.current);
      }
    };
  }, []);

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
        <Stack sx={{ mt: 1 }} spacing={1}>
          <Typography variant="body2" color="textSecondary">
            {t('overlayEditor.easy.selectLabel')}
          </Typography>
          <Select
            onChange={(e) => handleSelectChange('direction', e.target.value)}
            value={simpleLayoutData.direction || ''}
          >
            <MenuItem value={'row'}>{t('overlayEditor.easy.select.row')}</MenuItem>
            <MenuItem value={'column'}>{t('overlayEditor.easy.select.column')}</MenuItem>
          </Select>
        </Stack>

        <Stack sx={{ mt: 2 }} spacing={1}>
          <Typography variant="body2" color="textSecondary">
            {t('overlayEditor.easy.sliderLabel')}
          </Typography>

          <Slider
            value={Number(simpleLayoutData.gap) || 0}
            onChange={(e, value) => handleSliderInputChange('gap', value)}
            onChangeCommitted={(e, value) => handleSliderChangeCommitted('gap', value)}
            valueLabelDisplay="auto"
            min={0}
            max={64}
            step={1}
          />
        </Stack>

        <Stack sx={{ mt: 2 }} spacing={1}>
          <Typography variant="body2" color="textSecondary">
            {t('overlayEditor.easy.iconColor')}
          </Typography>
          <MuiColorInput
            format="hex"
            value={simpleLayoutData.iconColor || '#000000'}
            onChange={(color) => handleColorChange('iconColor', color)}
          />
        </Stack>

        <Stack sx={{ mt: 2 }} spacing={1}>
          <Typography variant="body2" color="textSecondary">
            {t('overlayEditor.easy.fontColor')}
          </Typography>
          <MuiColorInput
            format="hex"
            value={simpleLayoutData.fontColor || '#000000'}
            onChange={(color) => handleColorChange('fontColor', color)}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default EasyPanel;
