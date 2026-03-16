import React, { useMemo, useState } from 'react';
import { useLogger } from '../../contexts/LoggerContext';
import LogMessage from './components/LogMessage';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';

const LoggingFeed = () => {
  const { logs } = useLogger();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState('desc');

  const availableTypes = useMemo(() => {
    const uniqueTypes = new Set(logs.map((log) => log.type || 'log'));
    return ['all', ...Array.from(uniqueTypes)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const matchesSearch = (log) => {
      if (!needle) return true;
      const message = log.message?.toLowerCase() || '';
      const type = log.type?.toLowerCase() || '';
      return message.includes(needle) || type.includes(needle);
    };

    const matchesType = (log) => typeFilter === 'all' || log.type === typeFilter;
    const matchesSource = (log) => sourceFilter === 'all' || log.source === sourceFilter;

    const toTime = (timestamp) => {
      const date = timestamp ? new Date(timestamp) : null;
      return date?.getTime() || 0;
    };

    return [...logs]
      .filter((log) => matchesSearch(log) && matchesType(log) && matchesSource(log))
      .sort((a, b) => {
        const delta = toTime(a.timestamp) - toTime(b.timestamp);
        return sortDirection === 'asc' ? delta : -delta;
      });
  }, [logs, search, typeFilter, sourceFilter, sortDirection]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', p: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        <Typography variant="body2" color="text.secondary">
          {filteredLogs.length} / {logs.length} logs shown
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
        <TextField
          size="small"
          label="Search"
          placeholder="Search message or type"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

        <TextField
          size="small"
          select
          label="Type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          {availableTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type === 'all' ? 'All types' : type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          select
          label="Source"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
        >
          <MenuItem value="all">All sources</MenuItem>
          <MenuItem value="backend">Backend</MenuItem>
          <MenuItem value="frontend">Frontend</MenuItem>
        </TextField>

        <TextField
          size="small"
          select
          label="Sort"
          value={sortDirection}
          onChange={(event) => setSortDirection(event.target.value)}
        >
          <MenuItem value="desc">Newest first</MenuItem>
          <MenuItem value="asc">Oldest first</MenuItem>
        </TextField>
      </Stack>

      <Divider />

      <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filteredLogs.map((log) => (
          <LogMessage key={log.id} log={log} />
        ))}
        {!filteredLogs.length && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            No logs match the current filters.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoggingFeed;
