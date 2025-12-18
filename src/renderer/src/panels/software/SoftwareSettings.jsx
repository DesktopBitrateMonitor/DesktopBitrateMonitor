import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useStreamingSoftwareConfigStore } from '../../contexts/DataContext';
import ObsSettings from './components/ObsSettings.jsx';

const SOFTWARES = [
  { label: 'OBS Studio', value: 'obs-studio', isDev: false },
  { label: 'Streamlabs OBS', value: 'streamlabs-obs', isDev: false }
];

const SoftwareSettings = () => {
  const { streamingSoftwareConfig, updateStreamingSoftwareConfig } =
    useStreamingSoftwareConfigStore();

  const [softwareType, setSoftwareType] = React.useState(
    streamingSoftwareConfig?.currentType || 'obs-studio'
  );

  const [errorMessages, setErrorMessages] = React.useState({
    'obs-studio': '',
    'streamlabs-obs': ''
  });

  const getSoftwareSection = useCallback(
    (type) => {
      const section = streamingSoftwareConfig?.[type];
      return section ? section : { host: '', port: '', password: '' };
    },
    [streamingSoftwareConfig]
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

  const handleSettingsChange = useCallback(
    (type, data) => {
      updateStreamingSoftwareConfig((prev) => ({
        ...(prev || {}),
        [type]: data
      }));
    },
    [updateStreamingSoftwareConfig]
  );

  const saveSettings = useCallback(
    async (type, data) => {
      updateStreamingSoftwareConfig((prev) => ({
        ...(prev || {}),
        [type]: data
      }));

      await window.storeApi.set('streaming-software-config', type, data);
    },
    [updateStreamingSoftwareConfig]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
              type.isDev ? null : (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>
      {softwareType === 'obs-studio' && (
        <ObsSettings
          data={getSoftwareSection('obs-studio')}
          onChange={(data) => handleSettingsChange('obs-studio', data)}
          onSave={(data) => saveSettings('obs-studio', data)}
        />
      )}
    </Box>
  );
};

export default SoftwareSettings;
