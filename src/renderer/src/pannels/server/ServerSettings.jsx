import { Box, TextField, Typography } from '@mui/material';
import React from 'react';
import { useData } from '../../contexts/DataContenxt';

const SERVER_TYPES = [
  { label: 'SrtLiveServer', value: 'srt-live-server', isDev: false },
  { label: 'OpenIRL', value: 'openirl', isDev: false },
  { label: 'Belabox', value: 'belabox', isDev: true }
];

const OpenIrlElement = ({ data, onChange, value }) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        OpenIRL Settings
      </Typography>
      <TextField onChange={onChange} value={value} label="Server URL" />
    </Box>
  );
};

const SrtLiveServerElement = ({ data, onChange, value }) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        SrtLiveServer Settings
      </Typography>
      <TextField onChange={onChange} value={value} label="Server URL" />
    </Box>
  );
};

const ServerSettings = () => {
  const { serverConfig } = useData();

  return <h1>Server Settings</h1>;
};

export default ServerSettings;
