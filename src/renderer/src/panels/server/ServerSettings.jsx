import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import OpenIrlElement from './components/OpenIrlElement';
import SrtLiveServerElement from './components/SrtLiveServerElement';

const SERVER_TYPES = [
  { label: 'SrtLiveServer', value: 'srt-live-server', isDev: false },
  { label: 'OpenIRL', value: 'openirl', isDev: false },
  { label: 'Belabox', value: 'belabox', isDev: true }
];

const DEFAULT_SERVER_SECTION = {
  name: '',
  statsUrl: '',
  provider: ''
};

const ServerSettings = () => {
  const [errorMessages, setErrorMessages] = React.useState({
    'srt-live-server': '',
    openirl: '',
    belabox: ''
  });
  const [serverType, setServerType] = React.useState('srt-live-server');
  const [dirtyStates, setDirtyStates] = React.useState({
    'srt-live-server': false,
    openirl: false,
    belabox: false
  });

  const {
    data: { serverConfig },
    updateStoreLocally
  } = useData();

  useEffect(() => {
    if (serverConfig?.currentType) {
      setServerType(serverConfig.currentType);
    }
  }, [serverConfig?.currentType]);

  const getServerSection = useCallback(
    (type) => {
      const section = serverConfig?.[type];
      return section ? section : DEFAULT_SERVER_SECTION;
    },
    [serverConfig]
  );

  const handleServerTypeChange = useCallback(
    async (nextType) => {
      setServerType(nextType);
      updateStoreLocally('serverConfig', (prev) => ({
        ...(prev || {}),
        currentType: nextType
      }));
      await window.storeApi.set('server-config', 'currentType', nextType);
    },
    [updateStoreLocally]
  );

  const handleStatsUrlChange = useCallback(
    (type, value) => {
      const baseUrl = serverConfig?.[type]?.statsUrl || '';
      setDirtyStates((prev) => ({
        ...prev,
        [type]: baseUrl !== value
      }));
      updateStoreLocally('serverConfig', (prev) => ({
        ...(prev || {}),
        [type]: {
          ...(prev?.[type] || DEFAULT_SERVER_SECTION),
          statsUrl: value
        }
      }));
    },
    [serverConfig, updateStoreLocally]
  );

  const saveStatsUrl = useCallback(
    async (type, nextStatsUrl) => {
      const trimmed = (nextStatsUrl || '').trim();
      if (!trimmed || trimmed.replace(/\s+/g, '').length === 0) {
        return;
      }
      if (!trimmed.startsWith('http')) {
        return;
      }
      if (trimmed.includes(' ')) {
        return;
      }
      const existing = serverConfig?.[type] || DEFAULT_SERVER_SECTION;
      const payload = { ...existing, statsUrl: nextStatsUrl };

      updateStoreLocally('serverConfig', (prev) => ({
        ...(prev || {}),
        [type]: payload
      }));

      await window.storeApi.set('server-config', type, payload);
      setDirtyStates((prev) => ({
        ...prev,
        [type]: false
      }));
    },
    [serverConfig, updateStoreLocally]
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
            Server Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Edit the settings for the streaming server to listen to the stats
          </Typography>
        </Box>
        <FormControl>
          <InputLabel>Server Type</InputLabel>
          <Select
            id="server-type-label"
            label="Server Type"
            value={serverType}
            sx={{ width: '200px' }}
            onChange={(e) => handleServerTypeChange(e.target.value)}
          >
            {SERVER_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {serverType === 'openirl' && (
        <OpenIrlElement
          data={getServerSection('openirl')}
          saveStatsUrl={(value) => saveStatsUrl('openirl', value)}
          onChange={(e) => handleStatsUrlChange('openirl', e.target.value)}
          isDirty={dirtyStates['openirl']}
          errorMessage={errorMessages['openirl']}
          setErrorMessage={(value) =>
            setErrorMessages((prev) => ({
              ...prev,
              openirl: value
            }))
          }
        />
      )}
      {serverType === 'srt-live-server' && (
        <SrtLiveServerElement
          data={getServerSection('srt-live-server')}
          saveStatsUrl={(value) => saveStatsUrl('srt-live-server', value)}
          onChange={(e) => handleStatsUrlChange('srt-live-server', e.target.value)}
          isDirty={dirtyStates['srt-live-server']}
          errorMessage={errorMessages['srt-live-server']}
          setErrorMessage={(value) =>
            setErrorMessages((prev) => ({
              ...prev,
              'srt-live-server': value
            }))
          }
        />
      )}
      {serverType === 'belabox' && (
        <SrtLiveServerElement
          data={getServerSection('belabox')}
          saveStatsUrl={(value) => saveStatsUrl('belabox', value)}
          onChange={(e) => handleStatsUrlChange('belabox', e.target.value)}
          isDirty={dirtyStates['belabox']}
          errorMessage={errorMessages['belabox']}
          setErrorMessage={(value) =>
            setErrorMessages((prev) => ({
              ...prev,
              belabox: value
            }))
          }
        />
      )}
    </Box>
  );
};

export default ServerSettings;
