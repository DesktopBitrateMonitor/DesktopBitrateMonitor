import React, { useEffect, useMemo, useState } from 'react';
import path from 'path';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import { useLogger } from '../../contexts/LoggerContext';
import LogMessage from './components/LogMessage';
import { useLoggingConfigStore } from '../../contexts/DataContext';
import { useAlert } from '../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';

const menuButtonSx = {
  color: (theme) => theme.palette.text.secondary,
  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
  borderRadius: 2,
  backgroundColor: (theme) =>
    alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.8 : 0.4),
  '&:hover': {
    backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08)
  }
};

const MenuControl = ({ icon, label, value, options, onChange, ariaLabel }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (next) => {
    handleClose();
    if (next === undefined || next === null) return;
    onChange?.(next);
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconButton
        aria-label={ariaLabel || label}
        onClick={handleOpen}
        size="small"
        sx={menuButtonSx}
      >
        {icon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        PaperProps={{ onMouseLeave: handleClose }}
      >
        <ListSubheader>{label}</ListSubheader>
        <Divider variant="middle" sx={{ mb: 1 }} />
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => handleSelect(option.value)}
          >
            {option.icon ? <ListItemIcon>{option.icon}</ListItemIcon> : null}
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
};

const LoggingFeed = () => {
  const { t } = useTranslation();
  const { logs } = useLogger();
  const { loggingConfig } = useLoggingConfigStore();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState('desc');
  const [logPath, setLogPath] = useState();

  useEffect(() => {
    setLogPath(loggingConfig?.actionsLogsPath);
  }, [loggingConfig]);

  const availableTypes = useMemo(() => {
    const uniqueTypes = new Set(logs.map((log) => log.type || 'log'));
    return ['all', ...Array.from(uniqueTypes)];
  }, [logs]);

  const typeOptions = useMemo(
    () =>
      availableTypes.map((type) => ({
        value: type,
        label: type === 'all' ? 'All types' : type,
        icon:
          type === 'all' ? (
            <FilterListOutlinedIcon fontSize="small" />
          ) : (
            <LabelOutlinedIcon fontSize="small" />
          )
      })),
    [availableTypes]
  );

  const sourceOptions = useMemo(
    () => [
      { value: 'all', label: 'All sources', icon: <FilterListOutlinedIcon fontSize="small" /> },
      { value: 'backend', label: 'Backend', icon: <LanOutlinedIcon fontSize="small" /> },
      { value: 'frontend', label: 'Frontend', icon: <ComputerOutlinedIcon fontSize="small" /> }
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      {
        value: 'desc',
        label: 'Newest first',
        icon: <ArrowDownwardOutlinedIcon fontSize="small" />
      },
      { value: 'asc', label: 'Oldest first', icon: <ArrowUpwardOutlinedIcon fontSize="small" /> }
    ],
    []
  );

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

  const openSaveFileDialog = async () => {
    const options = {
      title: t('logging.export.header'),
      defaultPath: logPath + '\\logs_' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt',
      filters: [
        { name: t('logging.export.filter.txt'), extensions: ['txt'] },
        { name: t('logging.export.filter.csv'), extensions: ['csv'] }
      ]
    };
    const result = await window.loggerApi.saveFileDialog(options);

    const parsedLogs = logs.map((log) => ({
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString(),
      message: log.message
    }));

    console.log(parsedLogs);

    if (result.canceled) {
      showAlert({ message: t('logging.export.cancelledMessage'), severity: 'info' });
      return;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', p: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        <Typography variant="body2" color="text.secondary">
          {filteredLogs.length} / {logs.length} logs shown
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
        <TextField
          size="small"
          label="Search"
          placeholder="Search message or type"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />

        <IconButton onClick={openSaveFileDialog}>
          <DownloadIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <MenuControl
            icon={<FilterListOutlinedIcon fontSize="small" />}
            label="Filter by type"
            value={typeFilter}
            options={typeOptions}
            onChange={setTypeFilter}
            ariaLabel="Filter logs by type"
          />

          <MenuControl
            icon={<FilterListOutlinedIcon fontSize="small" />}
            label="Filter by source"
            value={sourceFilter}
            options={sourceOptions}
            onChange={setSourceFilter}
            ariaLabel="Filter logs by source"
          />

          <MenuControl
            icon={<SortOutlinedIcon fontSize="small" />}
            label="Sort order"
            value={sortDirection}
            options={sortOptions}
            onChange={setSortDirection}
            ariaLabel="Sort logs"
          />
        </Stack>
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
