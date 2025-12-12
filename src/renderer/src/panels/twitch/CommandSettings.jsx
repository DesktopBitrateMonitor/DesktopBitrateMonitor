import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useData } from '../../contexts/DataContext';
import LayoutToggle from '../../components/functional/LayoutToggle';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'mod', label: 'Mod' },
  { value: 'user', label: 'User' }
];

const getCommandTitle = (command) => command.label;

const normalizeAlias = (value) => {
  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return '';
  }
  return trimmed;
};

const CommandPanel = ({ command, onChange }) => {
  const [aliasDraft, setAliasDraft] = useState('');
  const [aliasError, setAliasError] = useState('');

  const aliasList = Array.isArray(command.cmd) ? command.cmd : [];
  const isAdminRole = command.requiredRole === 'admin';
  const title = getCommandTitle(command);

  const handleRoleChange = (_, nextRole) => {
    if (!nextRole || nextRole === command.requiredRole) {
      return;
    }
    const nextCommand = {
      ...command,
      requiredRole: nextRole,
      restricted: nextRole === 'admin' ? command.restricted : false
    };
    onChange(nextCommand);
  };

  const handleEnabledChange = (event) => {
    onChange({ ...command, enabled: event.target.checked });
  };

  const handleRestrictedChange = (event) => {
    if (!isAdminRole) {
      return;
    }
    onChange({ ...command, restricted: event.target.checked });
  };

  const handleAliasAdd = () => {
    const normalized = normalizeAlias(aliasDraft);
    if (!normalized) {
      setAliasError('Alias cannot be empty');
      return;
    }
    if (aliasList.some((alias) => alias === normalized)) {
      setAliasError('Alias already exists');
      return;
    }
    setAliasError('');
    setAliasDraft('');
    onChange({ ...command, cmd: [...aliasList, normalized] });
  };

  const handleAliasRemove = (alias) => {
    onChange({ ...command, cmd: aliasList.filter((item) => item !== alias) });
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 55%)'
            : theme.palette.background.paper,
        minHeight: 0
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1">{title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {command.description || 'No description provided.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {command.enabled ? 'Enabled' : 'Disabled'}
            </Typography>
            <Switch
              edge="end"
              checked={command.enabled}
              onChange={handleEnabledChange}
              inputProps={{ 'aria-label': `${title} enabled` }}
            />
          </Stack>
        </Stack>

        <Divider flexItem />

        <Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Stack spacing={0.5} alignItems="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
                >
                  Required Role
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={command.requiredRole}
                  onChange={handleRoleChange}
                  size="small"
                  sx={{
                    mt: 1,
                    display: 'inline-flex',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    backgroundColor: (theme) =>
                      alpha(
                        theme.palette.background.paper,
                        theme.palette.mode === 'light' ? 0.8 : 0.4
                      ),
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      fontSize: 12,
                      px: 1.75,
                      py: 0.5,
                      border: 'none',
                      borderRadius: 0,
                      color: (theme) => theme.palette.text.secondary,
                      transition: (theme) =>
                        theme.transitions.create(['background-color', 'color'], {
                          duration: theme.transitions.duration.shorter
                        }),
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08)
                      },
                      '&:not(:last-of-type)': {
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`
                      }
                    },
                    '& .MuiToggleButton-root.Mui-selected': {
                      color: (theme) => theme.palette.primary.main,
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.26)
                      }
                    }
                  }}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <ToggleButton key={value} value={value} disableRipple>
                      {label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Box>

            <Box>
              <Tooltip
                title="Only broadcaster-level users can execute restricted commands."
                arrow
                placement="top-start"
              >
                <Stack alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
                  >
                    Restricted Access
                  </Typography>
                  <Switch
                    checked={Boolean(command.restricted)}
                    onChange={handleRestrictedChange}
                    disabled={!isAdminRole}
                    inputProps={{ 'aria-label': `${title} restricted` }}
                  />
                </Stack>
              </Tooltip>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
          >
            Aliases
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {aliasList.length ? (
              aliasList.map((alias) => (
                <Chip
                  size="small"
                  key={alias}
                  label={alias}
                  onDelete={() => handleAliasRemove(alias)}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No aliases yet.
              </Typography>
            )}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField
              label="New alias"
              placeholder="!command"
              value={aliasDraft}
              onChange={(event) => {
                setAliasDraft(event.target.value);
                setAliasError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAliasAdd();
                }
              }}
              error={Boolean(aliasError)}
              helperText={aliasError || 'Prefix have to be included in Aliases'}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title="Click to add alias or press Enter"
                      placement="top-start"
                      open={Boolean(aliasDraft)}
                      disableFocusListener
                      disableHoverListener
                      disableTouchListener
                      slotProps={{
                        tooltip: {
                          sx: (theme) => ({
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            fontSize: 12,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            boxShadow: theme.shadows[4],
                            letterSpacing: 0.3
                          })
                        },
                        arrow: {
                          sx: (theme) => ({
                            color: theme.palette.primary.main
                          })
                        }
                      }}
                      arrow
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="Add alias"
                        onClick={handleAliasAdd}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Stack>
        </Box>

        {/* Restricted Access is now placed next to Required Role above */}
      </Stack>
    </Paper>
  );
};

const extractCommands = (commandsSnapshot) => {
  if (!commandsSnapshot) {
    return [];
  }
  if (Array.isArray(commandsSnapshot)) {
    return commandsSnapshot;
  }
  if (Array.isArray(commandsSnapshot.commands)) {
    return commandsSnapshot.commands;
  }
  return [];
};

const CommandSettings = () => {
  const {
    data: { commandsConfig, appConfig },
    updateStoreLocally
  } = useData();

  const [layoutMode, setLayoutMode] = useState('grid');

  const commands = useMemo(() => extractCommands(commandsConfig), [commandsConfig]);

  useEffect(() => {
    const storedLayout = appConfig?.layout?.settings?.twitchCommands;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    }
  }, [appConfig]);

  const persistCommands = useCallback(
    async (nextCommands) => {
      updateStoreLocally('commandsConfig', (prev) => {
        if (!prev) {
          return { commands: nextCommands };
        }
        if (Array.isArray(prev)) {
          return nextCommands;
        }
        return {
          ...prev,
          commands: nextCommands
        };
      });

      if (window?.storeApi?.set) {
        try {
          await window.storeApi.set('commands-config', 'commands', nextCommands);
        } catch (err) {
          console.error('Failed to persist commands', err);
        }
      }
    },
    [updateStoreLocally]
  );

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateStoreLocally('appConfig', (prev) => {
        const nextLayoutState = {
          ...(prev?.layout || {}),
          settings: {
            ...(prev?.layout?.settings || {}),
            twitchCommands: nextLayout
          }
        };

        return {
          ...(prev || {}),
          layout: nextLayoutState
        };
      });

      if (window?.storeApi?.set) {
        try {
          await window.storeApi.set('app-config', 'layout.settings.twitchCommands', nextLayout);
        } catch (err) {
          console.error('Failed to persist layout', err);
        }
      }
    },
    [updateStoreLocally]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      persistLayoutMode(nextLayout);
    },
    [layoutMode, persistLayoutMode]
  );

  const handleCommandChange = useCallback(
    (nextCommand) => {
      persistCommands(
        commands.map((command) => (command.id === nextCommand.id ? nextCommand : command))
      );
    },
    [commands, persistCommands]
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
            Command Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fine-tune Twitch bot commands, manage aliases, and control role restrictions per command.
          </Typography>
        </Box>

        <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
      </Box>

      {commands.length ? (
        <Box
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
          {commands.map((command) => (
            <CommandPanel key={command.id} command={command} onChange={handleCommandChange} />
          ))}
        </Box>
      ) : (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            No commands configured yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Commands from the store will appear here automatically once they are loaded.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CommandSettings;
