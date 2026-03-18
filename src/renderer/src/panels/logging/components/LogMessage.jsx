import React, { useMemo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

const typeColorMap = {
  error: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info',
  log: 'default'
};

const sourceColorMap = {
  backend: 'secondary',
  frontend: 'primary'
};

const LogMessage = ({ log }) => {
  const formattedTimestamp = useMemo(() => {
    const date = log.timestamp ? new Date(log.timestamp) : null;
    const time = date?.getTime();
    if (!time || Number.isNaN(time)) return '—';
    return date.toLocaleString();
  }, [log.timestamp]);

  const type = log.type || 'log';
  const source = log.source || 'unknown';
  const typeColor = typeColorMap[type] || 'default';
  const sourceColor = sourceColorMap[source] || 'default';

  return (
    <Box
      key={log.id}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        backgroundColor: 'background.paper'
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={type}
            size="small"
            color={typeColor}
            variant={typeColor === 'default' ? 'outlined' : 'filled'}
          />
          <Chip
            label={source}
            size="small"
            color={sourceColor}
            variant={sourceColor === 'default' ? 'outlined' : 'filled'}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {formattedTimestamp}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {log.message}
      </Typography>
    </Box>
  );
};

export default LogMessage;
