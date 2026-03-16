import React, { useMemo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

const LogMessage = ({ log }) => {
  const formattedTimestamp = useMemo(() => {
    const date = log.timestamp ? new Date(log.timestamp) : null;
    const time = date?.getTime();
    if (!time || Number.isNaN(time)) return '—';
    return date.toLocaleString();
  }, [log.timestamp]);

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
          <Chip label={log.type || 'log'} size="small" color="primary" variant="outlined" />
          <Chip label={log.source || 'unknown'} size="small" variant="outlined" />
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
