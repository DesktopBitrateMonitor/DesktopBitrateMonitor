import React, { useCallback, useEffect, useState } from 'react';
import { useSwitcherConfigStore } from '../../contexts/DataContext';
import LayoutToggle from '../../components/functional/LayoutToggle';
import Scenes from './components/Scenes.jsx';
import Switches from './components/Switches.jsx';
import Triggers from './components/Triggers.jsx';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SwitcherSettings = () => {
  const { t } = useTranslation();
  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const [layoutMode, setLayoutMode] = useState('grid');
  const [collapsedIds, setCollapsedIds] = useState(switcherConfig?.collapsed || []);

  useEffect(() => {
    const storedLayout = switcherConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('grid');
    }
  }, [switcherConfig]);

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateSwitcherConfig((prev) => ({
        ...(prev || {}),
        layout: nextLayout
      }));

      await window.storeApi.set('switcher-config', 'layout', nextLayout);
    },
    [updateSwitcherConfig]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      persistLayoutMode(nextLayout);
    },
    [layoutMode, persistLayoutMode]
  );

  const toggleCollapsed = useCallback(
    async (card) => {
      const next = collapsedIds.includes(card)
        ? collapsedIds.filter((id) => id !== card)
        : [...collapsedIds, card];
      setCollapsedIds(next);

      updateSwitcherConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('switcher-config', 'collapsed', next);
    },
    [collapsedIds, updateSwitcherConfig]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box
          sx={{
            display: 'flex',
            padding: '1.5rem 1.5rem 0 1.5rem',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {t('switcher.header')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('switcher.description')}
            </Typography>
          </Box>
          <Box>
            <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 0',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          pt: 2,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            px: 3,
            gridTemplateColumns:
              layoutMode === 'list'
                ? { xs: '1fr' }
                : {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    xl: 'repeat(3, minmax(0, 1fr))'
                  },
            overflowY: 'auto'
          }}
        >
          <Switches collapsedIds={collapsedIds} toggleCollapsed={toggleCollapsed} />
          <Scenes collapsedIds={collapsedIds} toggleCollapsed={toggleCollapsed} />
          <Triggers collapsedIds={collapsedIds} toggleCollapsed={toggleCollapsed} />
        </Box>
      </Box>
    </Box>
  );
};

export default SwitcherSettings;
