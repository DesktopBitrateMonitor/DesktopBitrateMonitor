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
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import SaveIcon from '@mui/icons-material/Save';
import { normalizeAlias } from '../../../scripts/shared-functions';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import NumericInput from '../../../components/functional/NumericInput';
import { useTranslation } from 'react-i18next';

const CommandPanel = ({ command, onChange, collapsible = true, expanded, onExpandedChange }) => {
  const { t } = useTranslation();
  const [aliasDraft, setAliasDraft] = useState('');
  const [aliasError, setAliasError] = useState('');

  const aliasList = Array.isArray(command.cmd) ? command.cmd : [];
  const hasAliases = aliasList.length > 0;

  const ROLE_OPTIONS = [
    { value: 'broadcaster', label: t('platforms.commands.roles.broadcaster') },
    { value: 'admin', label: t('platforms.commands.roles.admin') },
    { value: 'mod', label: t('platforms.commands.roles.moderator') },
    { value: 'user', label: t('platforms.commands.roles.user') }
  ];

  const initialCooldownData = {
    all: command.coolDowns.all,
    mod: command.coolDowns.mod,
    user: command.coolDowns.user
  };

  const [cooldownData, setCooldownData] = useState(initialCooldownData);
  const [oldValueDraft, setOldValueDraft] = useState(initialCooldownData);

  const [dirtyStates, setDirtyStates] = useState({
    all: false,
    mod: false,
    user: false
  });

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
      setAliasError(t('platforms.commands.aliasBox.error1'));
      return;
    }
    if (aliasList.some((alias) => alias.toLowerCase() === normalized.toLowerCase())) {
      setAliasError(t('platforms.commands.aliasBox.error2'));
      return;
    }
    setAliasError('');
    setAliasDraft('');
    onChange({ ...command, cmd: [...aliasList, normalized] });
  };

  const handleAliasRemove = (alias) => {
    onChange({ ...command, cmd: aliasList.filter((item) => item !== alias) });
  };

  const handleCooldownChange = (cooldownType, value) => {
    setCooldownData((prev) => ({ ...prev, [cooldownType]: value }));
    if (value !== oldValueDraft[cooldownType]) {
      setDirtyStates((prev) => ({ ...prev, [cooldownType]: true }));
    } else {
      setDirtyStates((prev) => ({ ...prev, [cooldownType]: false }));
    }
  };

  const handleCooldownSave = (cooldownType, value) => {
    const nextCommand = {
      ...command,
      coolDowns: {
        ...command.coolDowns,
        [cooldownType]: value
      }
    };
    onChange(nextCommand);
    setOldValueDraft((prev) => ({ ...prev, [cooldownType]: value }));
    setDirtyStates((prev) => ({ ...prev, [cooldownType]: false }));
  };

  return (
    <CollapsibleCard
      title={t(`platforms.commands.${command.action}.label`)}
      subtitle={t(`platforms.commands.${command.action}.description`) || null}
      actions={
        <>
          <Typography variant="body2" color="text.secondary">
            {command.enabled ? t('app.global.enabled') : t('app.global.disabled')}
          </Typography>
          <Switch edge="end" checked={command.enabled} onChange={handleEnabledChange} />
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
                  {t('platforms.commands.roleDescription')}
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
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                  {typeof command.restricted !== 'undefined' && (
                    <Tooltip title={t('platforms.commands.restrictedHint')}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch checked={command.restricted} onChange={handleRestrictedChange} />
                        <Typography variant="body2" color="text.secondary">
                          {command.restricted
                            ? t('platforms.commands.restricted')
                            : t('platforms.commands.notRestricted')}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  )}
                </Box>
              </Stack>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    alignSelf: { xs: 'flex-end', sm: 'flex-end', md: 'center' }
                  }}
                >
                  {t('platforms.commands.cooldowns.label')}
                </Typography>
                <Box
                  sx={{
                    flexWrap: 'wrap',
                    display: 'flex',
                    gap: 2,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginLeft: 2
                  }}
                >
                  <NumericInput
                    label={t('platforms.commands.cooldowns.all')}
                    name="allCooldown"
                    value={cooldownData.all}
                    onChange={(e) => handleCooldownChange('all', e.target.value)}
                    fullWidth={false}
                    sx={{ width: 120 }}
                    min={0}
                    allowEmpty={false}
                    slotProps={{
                      endAdornment: dirtyStates['all'] ? (
                        <InputEndAdornment
                          title={t('switcher.inputAdornment')}
                          placement="top-start"
                          open={Boolean(dirtyStates['all'])}
                          color="success"
                          icon={<SaveIcon color="success" />}
                          handleClick={() => handleCooldownSave('all', cooldownData.all)}
                        />
                      ) : undefined
                    }}
                  />
                  <NumericInput
                    label={t('platforms.commands.cooldowns.mod')}
                    name="modCooldown"
                    value={cooldownData.mod}
                    onChange={(e) => handleCooldownChange('mod', e.target.value)}
                    sx={{ width: 120 }}
                    fullWidth={false}
                    min={0}
                    allowEmpty={false}
                    slotProps={{
                      endAdornment: dirtyStates['mod'] ? (
                        <InputEndAdornment
                          title={t('switcher.inputAdornment')}
                          placement="top-start"
                          open={Boolean(dirtyStates['mod'])}
                          color="success"
                          icon={<SaveIcon color="success" />}
                          handleClick={() => handleCooldownSave('mod', cooldownData.mod)}
                        />
                      ) : undefined
                    }}
                  />
                  <NumericInput
                    label={t('platforms.commands.cooldowns.user')}
                    name="userCooldown"
                    value={cooldownData.user}
                    onChange={(e) => handleCooldownChange('user', e.target.value)}
                    sx={{ width: 120 }}
                    fullWidth={false}
                    min={0}
                    allowEmpty={false}
                    slotProps={{
                      endAdornment: dirtyStates['user'] ? (
                        <InputEndAdornment
                          title={t('switcher.inputAdornment')}
                          placement="top-start"
                          open={Boolean(dirtyStates['user'])}
                          color="success"
                          icon={<SaveIcon color="success" />}
                          handleClick={() => handleCooldownSave('user', cooldownData.user)}
                        />
                      ) : undefined
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
          >
            {t('platforms.commands.subHeader')}
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {aliasList.length ? (
              aliasList.map((alias) => (
                <Chip
                  // size="small"
                  key={alias}
                  label={alias}
                  color="primary"
                  variant="filled"
                  onDelete={() => handleAliasRemove(alias)}
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 0.25,
                    backgroundColor: (theme) =>
                      alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'light' ? 0.16 : 0.32
                      ),
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                    color: (theme) => theme.palette.primary.contrastText,
                    boxShadow: (theme) => `0 1px 6px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '& .MuiChip-deleteIcon': {
                      color: (theme) => theme.palette.error.light,
                      '&:hover': {
                        color: (theme) => theme.palette.error.main
                      }
                    }
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('platforms.commands.aliasBox.noAliases')}
              </Typography>
            )}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField
              label={t('platforms.commands.aliasBox.label')}
              placeholder={t('platforms.commands.aliasBox.placeholder')}
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
              helperText={aliasError || t('platforms.commands.aliasBox.hint')}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputEndAdornment
                      title={t('platforms.commands.aliasBox.inputAdornment')}
                      placement="top-start"
                      open={Boolean(aliasDraft)}
                      icon={<AddIcon fontSize="small" />}
                      handleClick={handleAliasAdd}
                    />
                  )
                }
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </CollapsibleCard>
  );
};

export default CommandPanel;
