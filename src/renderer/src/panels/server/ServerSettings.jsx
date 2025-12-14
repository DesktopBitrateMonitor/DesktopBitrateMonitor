import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

const SERVER_TYPES = [
  { label: 'SrtLiveServer', value: 'srt-live-server', isDev: false },
  { label: 'OpenIRL', value: 'openirl', isDev: false },
  { label: 'Belabox', value: 'belabox', isDev: true }
];

const OpenIrlElement = ({ data, onChange, saveStatsUrl }) => {
  const [errorMessage, setErrorMessage] = React.useState('');

  useEffect(() => {
    const value = data.statsUrl || '';

    if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
      setErrorMessage('Stats URL cannot be empty.');
    } else if (!value.startsWith('http')) {
      setErrorMessage('Stats URL must start with http.');
    } else if (value.includes(' ')) {
      setErrorMessage('Stats URL must not contain spaces.');
    } else {
      setErrorMessage('');
    }
  }, [data.statsUrl]);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        OpenIRL Settings
      </Typography>
      <TextField
        fullWidth
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            saveStatsUrl(e.target.value || '');
          }
        }}
        value={data.statsUrl || ''}
        label="Stats URL"
        error={Boolean(errorMessage)}
        helperText={errorMessage || 'Example: http://<ip>:<port>/stats/<streamId>'}
      />
    </Box>
  );
};

const SrtLiveServerElement = ({ data, onChange, saveStatsUrl }) => {
  const [errorMessage, setErrorMessage] = React.useState('');

  useEffect(() => {
    const value = data.statsUrl || '';

    if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
      setErrorMessage('Stats URL cannot be empty.');
    } else if (!value.startsWith('http')) {
      setErrorMessage('Stats URL must start with http.');
    } else if (value.includes(' ')) {
      setErrorMessage('Stats URL must not contain spaces.');
    } else {
      setErrorMessage('');
    }
  }, [data.statsUrl]);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        SrtLiveServer Settings
      </Typography>
      <TextField
        fullWidth
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            saveStatsUrl(e.target.value || '');
          }
        }}
        value={data.statsUrl || ''}
        label="Stats URL"
        error={Boolean(errorMessage)}
        helperText={errorMessage || 'Example: http://<ip>:9999/stats'}
      />
    </Box>
  );
};

const DEFAULT_SERVER_SECTION = {
  name: '',
  statsUrl: '',
  provider: ''
};

const ServerSettings = () => {
  const [serverType, setServerType] = React.useState('srt-live-server');

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
      updateStoreLocally('serverConfig', (prev) => ({
        ...(prev || {}),
        [type]: {
          ...(prev?.[type] || DEFAULT_SERVER_SECTION),
          statsUrl: value
        }
      }));
    },
    [updateStoreLocally]
  );

  const saveStatsUrl = useCallback(
    async (type, nextStatsUrl) => {
      const existing = serverConfig?.[type] || DEFAULT_SERVER_SECTION;
      const payload = { ...existing, statsUrl: nextStatsUrl };

      updateStoreLocally('serverConfig', (prev) => ({
        ...(prev || {}),
        [type]: payload
      }));

      await window.storeApi.set('server-config', type, payload);
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
      </Box>
      <FormControl>
        <InputLabel>Server Type</InputLabel>
        <Select
          id="server-type-label"
          label="Server Type"
          value={serverType}
          sx={{ width: '220px' }}
          onChange={(e) => handleServerTypeChange(e.target.value)}
        >
          {SERVER_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {serverType === 'openirl' && (
        <OpenIrlElement
          data={getServerSection('openirl')}
          saveStatsUrl={(value) => saveStatsUrl('openirl', value)}
          onChange={(e) => handleStatsUrlChange('openirl', e.target.value)}
        />
      )}
      {serverType === 'srt-live-server' && (
        <SrtLiveServerElement
          data={getServerSection('srt-live-server')}
          saveStatsUrl={(value) => saveStatsUrl('srt-live-server', value)}
          onChange={(e) => handleStatsUrlChange('srt-live-server', e.target.value)}
        />
      )}
      {serverType === 'belabox' && (
        <SrtLiveServerElement
          data={getServerSection('belabox')}
          saveStatsUrl={(value) => saveStatsUrl('belabox', value)}
          onChange={(e) => handleStatsUrlChange('belabox', e.target.value)}
        />
      )}
      {/* <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns:
            layoutMode === 'list'
              ? { xs: '1fr' }
              : {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(3, minmax(0, 1fr))'
                }
        }}
      >
        <CollapsibleCard
          title={'Broadcaster'}
          subtitle={'Login your broadcaster account here'}
          collapsible={layoutMode === 'list'}
          expanded={!collapsedIds.includes('broadcaster')}
          onExpandedChange={() => toggleCollapsed('broadcaster')}
        >
          <AccountPanel
            data={broadcasterData}
            accountType="broadcaster"
            login={() => handleLogin('broadcaster')}
            logout={() => handleLogout('broadcaster')}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title={'Chatbot'}
          subtitle={'Login your chatbot account here'}
          actions={
            <Box>
              <Tooltip title={'Use the chatbot account to post messages in the chat'}>
                <Typography variant="body2" color="text.secondary"></Typography>
                <Switch
                  checked={accountsConfig.useBotAccount}
                  onChange={handleSwitchChange}
                  disabled={!broadcasterData?.id}
                />
              </Tooltip>
            </Box>
          }
          collapsible={layoutMode === 'list'}
          expanded={!collapsedIds.includes('bot')}
          onExpandedChange={() => toggleCollapsed('bot')}
        >
          <AccountPanel
            data={chatbotData}
            accountType="bot"
            login={() => handleLogin('bot')}
            logout={() => handleLogout('bot')}
          />
        </CollapsibleCard>
      </Box> */}
    </Box>
  );
};

export default ServerSettings;
