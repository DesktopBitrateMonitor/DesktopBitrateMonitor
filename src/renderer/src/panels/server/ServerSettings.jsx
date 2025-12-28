import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { useServerConfigStore } from '../../contexts/DataContext';
import OpenIrlElement from './components/OpenIrlElement';
import SrtLiveServerElement from './components/SrtLiveServerElement';
import CollapsibleCard from '../../components/functional/CollapsibleCard.jsx';
import BelaboxElement from './components/BelaboxElement.jsx';

const SERVER_TYPES = [
  { label: 'SrtLiveServer', value: 'srt-live-server', isDev: false },
  { label: 'OpenIRL', value: 'openirl', isDev: false },
  { label: 'Belabox', value: 'belabox', isDev: true }
];

const isDev = import.meta.env.DEV;

const ServerSettings = () => {
  const { serverConfig, updateServerConfig } = useServerConfigStore();

  const [serverType, setServerType] = React.useState(serverConfig?.currentType);

  const handleServerTypeChange = useCallback(
    async (nextType) => {
      setServerType(nextType);
      updateServerConfig((prev) => ({
        ...(prev || {}),
        currentType: nextType
      }));
      await window.storeApi.set('server-config', 'currentType', nextType);
      await window.servicesApi.restartService('server-stats-fetcher');
    },
    [updateServerConfig]
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
            {SERVER_TYPES.map((type) =>
              type.isDev && !isDev ? null : (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>
      {serverType === 'openirl' && (
        <CollapsibleCard
          title={'OpenIRL Settings'}
          subtitle={'Setup the the connection to OpenIRL stats endpoint'}
          collapsible={false}
          defaultExpanded={true}
        >
          <OpenIrlElement />
        </CollapsibleCard>
      )}
      {serverType === 'srt-live-server' && (
        <CollapsibleCard
          title={'SrtLiveServer Settings'}
          subtitle={'Setup the the connection to SrtLiveServer stats endpoint'}
          collapsible={false}
          defaultExpanded={true}
        >
          <SrtLiveServerElement />
        </CollapsibleCard>
      )}
      {serverType === 'belabox' && (
        <CollapsibleCard
          title={'Belabox Settings'}
          subtitle={'Setup the the connection to Belabox stats endpoint'}
          collapsible={false}
          defaultExpanded={true}
        >
          <BelaboxElement />
        </CollapsibleCard>
      )}
    </Box>
  );
};

export default ServerSettings;
