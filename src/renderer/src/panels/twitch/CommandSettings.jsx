import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
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
import CollapsibleCard from '../../components/functional/CollapsibleCard';
import RoleSortControls from '../../components/functional/RoleSortControls';
import { normalizeAlias, sortTwitchCommands } from '../../../../scripts/lib/shared-functions';
import { storeLayoutChanges } from '../../scripts/lib';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'mod', label: 'Mod' },
  { value: 'user', label: 'User' }
];

const getCommandTitle = (command) => command.label;

const CommandPanel = ({ command, onChange, collapsible = true }) => {
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
    <CollapsibleCard
      title={title}
      subtitle={command.description || 'No description provided.'}
      actions={
        <>
          <Typography variant="body2" color="text.secondary">
            {command.enabled ? 'Enabled' : 'Disabled'}
          </Typography>
          <Switch
            edge="end"
            checked={command.enabled}
            onChange={handleEnabledChange}
            inputProps={{ 'aria-label': `${title} enabled` }}
          />
        </>
      }
      defaultExpanded
      collapsible={collapsible}
    >
      <Stack spacing={2}>
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
    </CollapsibleCard>
  );
};

const CommandSettings = () => {
  const {
    data: { commandsConfig, appConfig },
    updateStoreLocally
  } = useData();

  const [layoutMode, setLayoutMode] = useState('grid');
  const [sortMode, setSortMode] = useState('none');

  const commands = useMemo(
    () => sortTwitchCommands(commandsConfig.commands, sortMode),
    [commandsConfig.commands, sortMode]
  );

  useEffect(() => {
    const storedLayout = appConfig?.layout?.settings?.layout?.twitchCommands?.layout;
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
            layout: {
              ...(prev?.layout?.settings?.layout || {}),
              twitchCommands: {
                ...(prev?.layout?.settings?.layout?.twitchCommands || {}),
                layout: nextLayout
              }
            }
          }
        };

        return {
          ...(prev || {}),
          layout: nextLayoutState
        };
      });
      storeLayoutChanges({ layout: nextLayout, key: 'twitchCommands' });
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
            Edit and manage the Twitch commands for the application.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <RoleSortControls value={sortMode} onChange={setSortMode} />
          <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
        </Stack>
      </Box>
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
          <CommandPanel
            key={command.id}
            command={command}
            onChange={handleCommandChange}
            collapsible={layoutMode === 'list'}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CommandSettings;
