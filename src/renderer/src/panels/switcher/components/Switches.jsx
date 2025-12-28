import { Box, Switch, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { useAlert } from '../../../contexts/AlertContext';
import { useSwitcherConfigStore } from '../../../contexts/DataContext';

const Switches = ({ collapsedIds, toggleCollapsed }) => {
  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const { showAlert } = useAlert();

  const SWITCH_MAPPINGS = {
    switcherEnabled: 'Enable Switcher',
    onlySwitchWhenLive: 'Only Switch When Live',
    enableChatNotifications: 'Enable Chat Notifications',
    switchToStartSceneOnStreamStart: 'Switch to Start Scene on Stream Start',
    stopStreamAfterRaid: 'Stop Stream After Raid'
  };

  const switchesData = {
    switcherEnabled: switcherConfig.switcherEnabled,
    onlySwitchWhenLive: switcherConfig.onlySwitchWhenLive,
    enableChatNotifications: switcherConfig.enableChatNotifications,
    switchToStartSceneOnStreamStart: switcherConfig.switchToStartSceneOnStreamStart,
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
          message: `${SWITCH_MAPPINGS[key]} updated successfully`,
          severity: 'success'
        });
      } else {
        showAlert({
          message: `Failed to update ${SWITCH_MAPPINGS[key]}`,
          severity: 'error'
        });
      }
    },
    [updateSwitcherConfig]
  );
  return (
    <Box>
      <CollapsibleCard
        title={'Switcher state Settings'}
        subtitle={'Setup the switcher enabled states'}
        expanded={collapsedIds.includes('switches')}
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
