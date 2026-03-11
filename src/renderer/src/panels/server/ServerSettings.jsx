import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { useServerConfigStore } from '../../contexts/DataContext';
import OpenIrlElement from './components/OpenIrlElement';
import SrtLiveServerElement from './components/SrtLiveServerElement';
import CollapsibleCard from '../../components/functional/CollapsibleCard.jsx';
import BelaboxElement from './components/BelaboxElement.jsx';
import { useTranslation } from 'react-i18next';

const isDev = import.meta.env.DEV;

const ServerSettings = () => {
  const {t} = useTranslation();

  const SERVER_TYPES = [
  { label: t('server.select.options.srtLiveServer'), value: 'srt-live-server', isDev: false },
  { label: t('server.select.options.openIrl'), value: 'openirl', isDev: false },
  { label: t('server.select.options.belabox'), value: 'belabox', isDev: true }
];

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
      await window.servicesApi.restartStatsFetcherService('server-stats-fetcher');
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
           {t('server.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('server.description')}
          </Typography>
        </Box>
        <FormControl>
          <InputLabel>{t('server.select.label')}</InputLabel>
          <Select
            id="server-type-label"
            label={t('server.select.label')}
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
          title={t('server.openIrl.header')}
          subtitle={t('server.openIrl.description')}
          collapsible={false}
          defaultExpanded={true}
        >
          <OpenIrlElement />
        </CollapsibleCard>
      )}
      {serverType === 'srt-live-server' && (
        <CollapsibleCard
          title={t('server.srtLiveServer.header')}
          subtitle={t('server.srtLiveServer.description')}
          collapsible={false}
          defaultExpanded={true}
        >
          <SrtLiveServerElement />
        </CollapsibleCard>
      )}
      {serverType === 'belabox' && (
        <CollapsibleCard
          title={t('server.belabox.header')}
          subtitle={t('server.belabox.description')}
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
