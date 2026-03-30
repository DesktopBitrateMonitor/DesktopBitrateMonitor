import { Box, Switch, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { useAlert } from '../../../contexts/AlertContext';
import { useSwitcherConfigStore } from '../../../contexts/DataContext';
import { useTranslation } from 'react-i18next';

const Switches = ({ collapsedIds, toggleCollapsed }) => {
  const { t } = useTranslation();
  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const { showAlert } = useAlert();

  const SWITCH_MAPPINGS = {
    switcherEnabled: t('switcher.states.enableSwitcher'),
    onlySwitchWhenLive: t('switcher.states.onlySwitchWhenLive'),
    enableChatNotifications: t('switcher.states.enableChatNotifications'),
    switchToStartSceneOnStreamStart: t('switcher.states.switchToStartSceneOnStreamStart'),
    switchFromStartingToLive: t('switcher.states.switchFromStartingToLive'),
    stopStreamAfterRaid: t('switcher.states.stopStreamAfterRaid')
  };

  const switchesData = {
    switcherEnabled: switcherConfig.switcherEnabled,
    onlySwitchWhenLive: switcherConfig.onlySwitchWhenLive,
    enableChatNotifications: switcherConfig.enableChatNotifications,
    switchToStartSceneOnStreamStart: switcherConfig.switchToStartSceneOnStreamStart,
    switchFromStartingToLive: switcherConfig.switchFromStartingToLive,
    stopStreamAfterRaid: switcherConfig.stopStreamAfterRaid
  };

  const handleSwitcherChange = useCallback(
    async (key, value) => {
      updateSwitcherConfig((prev) => ({
        ...(prev || {}),
        [key]: value
      }));

      const res = await window.storeApi.set('switcher-config', key, value);
      if (res.success) {
        showAlert({
          message: t('alerts.saveStateSuccess', { key: SWITCH_MAPPINGS[key] }),
          severity: 'success'
        });
      } else {
        showAlert({
          message: t('alerts.saveStateError', { key: SWITCH_MAPPINGS[key] }),
          severity: 'error'
        });
      }
    },
    [updateSwitcherConfig]
  );
  return (
    <Box>
      <CollapsibleCard
        title={t('switcher.states.header')}
        subtitle={t('switcher.states.description')}
        expanded={!collapsedIds.includes('switches')}
        onExpandedChange={() => toggleCollapsed('switches')}
      >
        {Object.entries(switchesData).map(([key, value]) => (
          <Box key={key} mb={2}>
            <Switch checked={value} onChange={(e) => handleSwitcherChange(key, e.target.checked)} />
            <Typography variant="body2" component="span">
              {SWITCH_MAPPINGS[key]}
            </Typography>
          </Box>
        ))}
      </CollapsibleCard>
    </Box>
  );
};

export default Switches;
