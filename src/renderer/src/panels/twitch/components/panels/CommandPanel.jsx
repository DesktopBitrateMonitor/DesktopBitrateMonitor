import React, { useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CollapsibleCard from '../../../../components/functional/CollapsibleCard';
import { normalizeAlias } from '../../../../scripts/shared-functions';
import InputEndAdornment from '../../../../components/feedback/InputEndAdornment';

const ROLE_OPTIONS = [
  { value: 'broadcaster', label: 'Broadcaster' },
  { value: 'admin', label: 'Admin' },
  { value: 'mod', label: 'Mod' },
  { value: 'user', label: 'User' }
];

const CommandPanel = ({ command, onChange, collapsible = true, expanded, onExpandedChange }) => {
  const [aliasDraft, setAliasDraft] = useState('');
  const [aliasError, setAliasError] = useState('');

  const aliasList = Array.isArray(command.cmd) ? command.cmd : [];
  const title = command.label;
  const hasAliases = aliasList.length > 0;

  const handleRoleChange = (_, nextRole) => {
    if (!nextRole || nextRole === command.requiredRole) {
      return;
    }
    const nextCommand = {
      ...command,
      requiredRole: nextRole
    };
    onChange(nextCommand);
  };

  const handleEnabledChange = (event) => {
    onChange({ ...command, enabled: event.target.checked });
  };

  const handleRestrictedChange = (event) => {
    onChange({ ...command, restricted: event.target.checked });
  };

  const handleAliasAdd = () => {
    const normalized = normalizeAlias(aliasDraft);
    if (!normalized) {
      setAliasError('Alias cannot be empty');
      return;
    }
    if (aliasList.some((alias) => alias.toLowerCase() === normalized.toLowerCase())) {
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
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      sx={
        hasAliases
          ? undefined
          : (theme) => ({
              borderColor: theme.palette.warning.main,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.warning.main, 0.25)}`
            })
      }
    >
      <Stack spacing={2}>
        <Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box display={'flex'} width={'100%'} justifyContent={'space-between'}>
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
              {typeof command.restricted !== 'undefined' && (
                <Tooltip title="If restricted, only the broadcaster and admins can switch to the live scene">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {command.restricted ? 'Restricted' : 'Not Restricted'}
                    </Typography>
                    <Switch checked={command.restricted} onChange={handleRestrictedChange} />
                  </Stack>
                </Tooltip>
              )}
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
                  <InputEndAdornment
                    title="Click to add alias or press enter"
                    placement="top-start"
                    open={Boolean(aliasDraft)}
                    icon={<AddIcon fontSize="small" />}
                    handleClick={handleAliasAdd}
                  />
                )
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </CollapsibleCard>
  );
};

export default CommandPanel;
