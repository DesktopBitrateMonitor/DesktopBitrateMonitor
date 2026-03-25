import { Box, Button, Switch, Tab, Tabs, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import JsEditor from './components/JsEditor';
import PreviewOverlay from './components/PreviewOverlay';
import HtmlEditor from './components/HtmlEditor';
import CssEditor from './components/CssEditor';
import JavascriptIcon from '@mui/icons-material/Javascript';
import CssIcon from '@mui/icons-material/Css';
import HtmlIcon from '@mui/icons-material/Html';
import { useOverlayConfigStore } from '../../contexts/DataContext';
import { useAlert } from '../../contexts/AlertContext';

const OverlayEditor = () => {
  const { t } = useTranslation();

  const { overlayConfig, updateOverlayConfig } = useOverlayConfigStore();
  const { showAlert } = useAlert();

  const [workingConfig, setWorkingConfig] = useState({ html: '', css: '', js: '' });
  const hasLoadedInitialOverlay = useRef(false);
  const TAB_CONFIG = [
    {
      value: 'html',
      label: t('overlayEditor.panels.html'),
      icon: HtmlIcon,
      content: (
        <HtmlEditor
          key={'html'}
          workingConfig={workingConfig}
          setWorkingConfig={setWorkingConfig}
        />
      )
    },
    {
      value: 'css',
      label: t('overlayEditor.panels.css'),
      icon: CssIcon,
      content: (
        <CssEditor key={'css'} workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
      )
    },
    {
      value: 'js',
      label: t('overlayEditor.panels.js'),
      icon: JavascriptIcon,
      content: (
        <JsEditor key={'js'} workingConfig={workingConfig} setWorkingConfig={setWorkingConfig} />
      )
    }
  ];

  const [activeValue, setActiveValue] = useState(TAB_CONFIG[0].value);

  useEffect(() => {
    if (hasLoadedInitialOverlay.current) return;
    if (!overlayConfig?.overlay) return;

    setWorkingConfig({
      html: overlayConfig.overlay.html || '',
      css: overlayConfig.overlay.css || '',
      js: overlayConfig.overlay.js || ''
    });

    hasLoadedInitialOverlay.current = true;
  }, [overlayConfig?.overlay]);

  const handleChange = useCallback(
    (event, newValue) => {
      setActiveValue(newValue);
    },
    [setActiveValue]
  );

  const handleSaveOverlay = async () => {
    const res = await window.storeApi.set('overlay-config', 'overlay', workingConfig);

    if (!res.success) {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
      return;
    }

    updateOverlayConfig(workingConfig);
    await window.servicesApi.reloadOverlay({type: 'overlay', config: workingConfig});
    showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {t('overlayEditor.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('overlayEditor.description')}
          </Typography>
        </Box>
        <Box>
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
          // overflowY: 'auto',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <Tabs
          value={activeValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 1
          }}
        >
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tab
                key={tab.value}
                value={tab.value}
                icon={<Icon fontSize="large" />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 500, minHeight: 44 }}
              />
            );
          })}
        </Tabs>
        <Box
          sx={{
            flex: '1 1 0',
            pt: 2,
            px: 1.5,
            pb: 1.5,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          <PreviewOverlay workingConfig={workingConfig} />
          {TAB_CONFIG.map((tab) => {
            if (tab.value === activeValue) {
              return tab.content;
            }
            return null;
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default OverlayEditor;
