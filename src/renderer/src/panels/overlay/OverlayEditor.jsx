import {
  Box,
  Button,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOverlayConfigStore } from '../../contexts/DataContext';
import { useAlert } from '../../contexts/AlertContext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EasyPanel from './panels/EasyPanel';
import ExpertPanel from './panels/ExpertPanel';

const OverlayEditor = () => {
  const { t } = useTranslation();
  const { overlayConfig, updateOverlayConfig } = useOverlayConfigStore();
  const { showAlert } = useAlert();

  const [workingConfig, setWorkingConfig] = useState({ html: '', css: '', js: '' });
  const [expertMode, setExpertMode] = useState(false);
  const [overlayStatsUrl, setOverlayStatsUrl] = useState('');
  const hasLoadedInitialOverlay = useRef(false);

  useEffect(() => {
    setExpertMode(overlayConfig.expertMode);
    setOverlayStatsUrl(overlayConfig.statsOverlayUrl);
  }, [overlayConfig]);

  useEffect(() => {
    if (hasLoadedInitialOverlay.current) return;

    setWorkingConfig({
      html: overlayConfig.overlay[overlayConfig.expertMode ? 'expert' : 'easy'].html || '',
      css: overlayConfig.overlay[overlayConfig.expertMode ? 'expert' : 'easy'].css || '',
      js: overlayConfig.overlay[overlayConfig.expertMode ? 'expert' : 'easy'].js || '',
      data: overlayConfig.overlay[overlayConfig.expertMode ? 'expert' : 'easy'].data || {}
    });

    hasLoadedInitialOverlay.current = true;
  }, [overlayConfig.overlay]);

  const handleSaveOverlay = async () => {
    const res = await window.storeApi.set(
      'overlay-config',
      `overlay.${expertMode ? 'expert' : 'easy'}`,
      workingConfig
    );

    if (!res.success) {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
      return;
    }

    updateOverlayConfig((prev) => ({
      ...prev,
      overlay: {
        ...(prev.overlay || {}),
        [expertMode ? 'expert' : 'easy']: workingConfig
      }
    }));

    const createOverlayPayload = () => {
      return {
        ...overlayConfig,
        overlay: {
          ...(overlayConfig.overlay || {}),
          [expertMode ? 'expert' : 'easy']: workingConfig
        }
      };
    };

    const reloadPayload = {
      type: 'overlay',
      data: createOverlayPayload()
    };

    await window.servicesApi.reloadOverlay(reloadPayload);
    showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
  };

  const handleCopyStatsUrl = useCallback(() => {
    navigator.clipboard.writeText(overlayStatsUrl).then(
      () => {
        showAlert({ message: t('alerts.copySuccess'), severity: 'success' });
      },
      () => {
        showAlert({ message: t('alerts.copyError'), severity: 'error' });
      }
    );
  }, [overlayStatsUrl, showAlert, t]);

  const handleSwitchChange = useCallback(
    async (key, value) => {
      updateOverlayConfig((prev) => ({
        ...(prev || {}),
        [key]: value
      }));

      if (key === 'expertMode' && value) {
        setWorkingConfig({
          html: overlayConfig.overlay.expert.html || '',
          css: overlayConfig.overlay.expert.css || '',
          js: overlayConfig.overlay.expert.js || '',
          data: overlayConfig.overlay.expert.data || {}
        });
      } else {
        setWorkingConfig({
          html: overlayConfig.overlay.easy.html || '',
          css: overlayConfig.overlay.easy.css || '',
          js: overlayConfig.overlay.easy.js || '',
          data: overlayConfig.overlay.easy.data || {}
        });
      }

      const res = await window.storeApi.set('overlay-config', key, value);
      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [updateOverlayConfig, overlayConfig, showAlert, t]
  );

  const overlayUrl =
    'http://localhost:9898/overlay/stats?layer-name=StreamStats&layer-width=400&layer-height=200';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          // flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {t('overlayEditor.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '80%' }}>
            {t('overlayEditor.description')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Switch
              onChange={(e) => {
                const checked = e.target.checked;
                setExpertMode(checked);
                handleSwitchChange('expertMode', checked);
              }}
              checked={expertMode}
            />
            <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 1 }}>
              {t('overlayEditor.expertMode')}
            </Typography>
          </Box>
          <Button onClick={handleSaveOverlay}>{t('app.global.button.save')}</Button>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 0',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          pt: 2,
          px: 1.5,
          pb: 1.5,
          overflowX: 'hidden',
          overflowY: 'auto',
          minHeight: 0
        }}
      >
        <Stack sx={{ mb: 2 }} direction="row" alignItems="center" spacing={2}>
          <Tooltip title={t('overlayEditor.easy.dragToolTip')} arrow placement="top">
            <Button
              draggable
              onClick={(e) => e.preventDefault()}
              size="medium"
              sx={{ cursor: 'grabbing', whiteSpace: 'nowrap' }}
              onDragStart={(e) => {
                try {
                  e.dataTransfer.setData('text/uri-list', overlayUrl);
                  e.dataTransfer.setData('text/plain', overlayUrl);
                } catch (error) {
                  //void
                }
              }}
            >
              {t('overlayEditor.easy.dragNdrop')}
            </Button>
          </Tooltip>

          <TextField
            label={t('overlayEditor.statsOverlayUrl')}
            value={overlayStatsUrl}
            fullWidth
            sx={{
              '& .MuiInputBase-root': { cursor: 'pointer' },
              '& .MuiInputBase-input': { cursor: 'pointer' }
            }}
            onClick={handleCopyStatsUrl}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <>
                    <ContentCopyIcon fontSize="small" />
                  </>
                )
              }
            }}
          />
        </Stack>
        {expertMode ? (
          <ExpertPanel workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
        ) : (
          <EasyPanel workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
        )}
      </Box>
    </Box>
  );
};

export default OverlayEditor;
