import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useStreamingSoftwareConfigStore } from '../../contexts/DataContext';
import ObsSettings from './components/ObsSettings.jsx';
import CollapsibleCard from '../../components/functional/CollapsibleCard.jsx';
import StreamlabsObsSettings from './components/StreamlabsObsSettings.jsx';
import MeldStudioSettings from './components/MeldStudioSettings.jsx';

const SOFTWARES = [
  { label: 'OBS Studio', value: 'obs-studio', isDev: false },
  { label: 'Streamlabs OBS', value: 'streamlabs-obs', isDev: true },
  { label: 'MELD Studio', value: 'meld-studio', isDev: true }
];

const isDev = import.meta.env.DEV;

const SoftwareSettings = () => {
  const { streamingSoftwareConfig, updateStreamingSoftwareConfig } =
    useStreamingSoftwareConfigStore();

  const [softwareType, setSoftwareType] = React.useState(
    streamingSoftwareConfig?.currentType || 'obs-studio'
  );

  const handleSoftwareTypeChange = useCallback(
    async (nextType) => {
      setSoftwareType(nextType);
      updateStreamingSoftwareConfig((prev) => ({
        ...(prev || {}),
        currentType: nextType
      }));
      await window.storeApi.set('streaming-software-config', 'currentType', nextType);
    },
    [setSoftwareType, updateStreamingSoftwareConfig]
  );

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
            Software Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose and configure your streaming software settings here
          </Typography>
        </Box>
        <FormControl>
          <InputLabel>Software Type</InputLabel>
          <Select
            id="software-type-label"
            label="Software Type"
            value={softwareType}
            sx={{ width: '200px' }}
            onChange={(e) => handleSoftwareTypeChange(e.target.value)}
          >
            {SOFTWARES.map((type) =>
              type.isDev && !isDev ? null : (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>
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
        {softwareType === 'obs-studio' && (
          <CollapsibleCard
            title={' OBS Studio Settings'}
            subtitle={'Setup the connection to OBS'}
            collapsible={false}
            defaultExpanded={true}
          >
            <ObsSettings />
          </CollapsibleCard>
        )}
        {softwareType === 'streamlabs-obs' && (
          <CollapsibleCard
            title={' Streamlabs OBS Settings'}
            subtitle={'Setup the connection to Streamlabs OBS'}
            collapsible={false}
            defaultExpanded={true}
          >
            <StreamlabsObsSettings />
          </CollapsibleCard>
        )}
        {softwareType === 'meld-studio' && (
          <CollapsibleCard
            title={' MELD Studio Settings'}
            subtitle={'Setup the connection to MELD Studio'}
            collapsible={false}
            defaultExpanded={true}
          >
            <MeldStudioSettings />
          </CollapsibleCard>
        )}
      </Box>
    </Box>
  );
};

export default SoftwareSettings;
