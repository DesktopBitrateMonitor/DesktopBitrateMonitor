import React, { useCallback, useEffect } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useKickAccountsConfig } from '../../../contexts/DataContext';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useTranslation } from 'react-i18next';

const KickUserSettings = () => {
  const { t } = useTranslation();
  const { kickAccountsConfig, updateKickAccountsConfig } = useKickAccountsConfig();
  const { showAlert } = useAlert();
  const theme = useTheme();

  const [layoutMode, setLayoutMode] = React.useState('grid');
  const [users, setUsers] = React.useState({ admin: '', mod: '' });
  const [adminsList, setAdminsList] = React.useState(kickAccountsConfig?.admins ?? []);
  const [modsList, setModsList] = React.useState(kickAccountsConfig?.mods ?? []);
  const [isValidating, setIsValidating] = React.useState({ admin: false, mod: false });

  useEffect(() => {
    const storedLayout = kickAccountsConfig?.userLayout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('list');
    }

    setAdminsList(kickAccountsConfig?.admins);
    setModsList(kickAccountsConfig?.mods);
  }, [kickAccountsConfig]);

  useEffect(() => {
    window.authApi.updateKickUser((data) => {
      if (data?.type === 'admin') {
        if (data?.action === 'add') {
          const updatedAdmins = [...adminsList, data.user];
          setAdminsList(updatedAdmins);
          updateKickAccountsConfig((prev) => ({ ...(prev || {}), admins: updatedAdmins }));
        } else if (data?.action === 'remove') {
          const updatedAdmins = adminsList.filter((admin) => admin.id !== data.user.id);
          setAdminsList(updatedAdmins);
          updateKickAccountsConfig((prev) => ({ ...(prev || {}), admins: updatedAdmins }));
        }
      } else if (data?.type === 'mod') {
        if (data?.action === 'add') {
          const updatedMods = [...modsList, data.user];
          setModsList(updatedMods);
          updateKickAccountsConfig((prev) => ({ ...(prev || {}), mods: updatedMods }));
        } else if (data?.action === 'remove') {
          const updatedMods = modsList.filter((mod) => mod.id !== data.user.id);
          setModsList(updatedMods);
          updateKickAccountsConfig((prev) => ({ ...(prev || {}), mods: updatedMods }));
        }
      }
    });
  }, [updateKickAccountsConfig, adminsList, modsList]);

  const isUserInputValid = (value = '') => value.trim().replace(/\s/g, '').length > 0;

  const handleLayoutChange = useCallback(
    async (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      setLayoutMode(nextLayout);
      updateKickAccountsConfig((prev) => ({ ...(prev || {}), userLayout: nextLayout }));
      await window.storeApi.set('kick-accounts-config', 'userLayout', nextLayout);
    },
    [kickAccountsConfig, updateKickAccountsConfig]
  );

  const handleInputChange = (userType, value) => {
    setUsers((prev) => ({ ...prev, [userType]: value }));
  };

  const handleAddUser = async (userType, user) => {
    if (!isUserInputValid(user)) {
      showAlert({ message: t('platforms.kick.users.error1'), severity: 'error' });
      return;
    }
    setIsValidating((prev) => ({ ...prev, [userType]: true }));
    try {
      const res = await window.authApi.validateKickUser(userType, user);
      if (res?.data?.user === undefined) {
        showAlert({ message: t('platforms.kick.users.error2'), severity: 'error' });
        return;
      }
      const newUser = res.data.user;
      if (userType === 'admin') {
        if (adminsList.some((admin) => admin.id === newUser.id)) {
          showAlert({ message: t('platforms.kick.users.error3'), severity: 'error' });
          return;
        }
        const updatedAdmins = [...adminsList, newUser];
        setAdminsList(updatedAdmins);
        updateKickAccountsConfig((prev) => ({ ...(prev || {}), admins: updatedAdmins }));
        await window.storeApi.set('kick-accounts-config', 'admins', updatedAdmins);
      } else if (userType === 'mod') {
        if (modsList.some((mod) => mod.id === newUser.id)) {
          showAlert({ message: t('platforms.kick.users.error4'), severity: 'error' });
          return;
        }
        const updatedMods = [...modsList, newUser];
        setModsList(updatedMods);
        updateKickAccountsConfig((prev) => ({ ...(prev || {}), mods: updatedMods }));
        await window.storeApi.set('kick-accounts-config', 'mods', updatedMods);
      }
      setUsers((prev) => ({ ...prev, [userType]: '' }));
      (prev) => ({ ...prev, [userType]: '' });
    } catch (error) {
      console.error('validateUser failed', error);
      showAlert({ message: t('platforms.kick.users.error5'), severity: 'error' });
    } finally {
      setIsValidating((prev) => ({ ...prev, [userType]: false }));
    }
  };

  const handleRemoveUser = async (userType, user) => {
    if (userType === 'admin') {
      const updatedAdmins = adminsList.filter((admin) => admin.id !== user.id);
      setAdminsList(updatedAdmins);
      updateKickAccountsConfig((prev) => ({ ...(prev || {}), admins: updatedAdmins }));
      window.storeApi.set('kick-accounts-config', 'admins', updatedAdmins);
    } else if (userType === 'mod') {
      const updatedMods = modsList.filter((mod) => mod.id !== user.id);
      setModsList(updatedMods);
      updateKickAccountsConfig((prev) => ({ ...(prev || {}), mods: updatedMods }));
      window.storeApi.set('kick-accounts-config', 'mods', updatedMods);
    }
  };

  const getInputAdornment = (userType, value) => {
    if (isValidating[userType]) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <CircularProgress size={18} thickness={5} color="primary" />
        </Box>
      );
    }

    if (!isUserInputValid(value)) {
      return null;
    }

    const isAdmin = userType === 'admin';

    return (
      <InputEndAdornment
        title={isAdmin ? t('platforms.kick.users.inputAdornmentAdmin') : t('platforms.kick.users.inputAdornmentMod')}
        placement="top-start"
        open={Boolean(isUserInputValid(value))}
        color="secondary"
        icon={<PersonAddIcon color="secondary" />}
        handleClick={() => handleAddUser(userType, value)}
      />
    );
  };

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
            {t('platforms.kick.users.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={600}>
            {t('platforms.kick.users.description')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
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
        {kickAccountsConfig.broadcaster.login.length === 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="error.main">
              {t('platforms.kick.users.noAccountRegistered')}
            </Typography>
          </Box>
        ) : (
          <>
            <CollapsibleCard
              title={t('platforms.kick.users.admins.header')}
              subtitle={t('platforms.kick.users.admins.description')}
              collapsible={false}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ flexWrap: 'wrap', display: 'flex', gap: 1 }}>
                  {adminsList.map((admin) => (
                    <Chip
                      key={admin.id}
                      avatar={<Avatar alt={admin.display_name} src={admin.profile_image_url} />}
                      label={admin.display_name}
                      onDelete={() => handleRemoveUser('admin', admin)}
                      variant="filled"
                      sx={{
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        color: theme.palette.text.primary,
                        border: '1px dashed',
                        borderColor: alpha(theme.palette.text.primary, 0.2),
                        borderRadius: '999px',
                        fontWeight: 600,
                        '& .MuiChip-avatar': {
                          border: '1px solid',
                          borderColor: alpha(theme.palette.text.primary, 0.15)
                        },
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.error.light,
                          '&:hover': {
                            color: theme.palette.error.main
                          }
                        },
                        '& .MuiChip-avatar img': { objectFit: 'cover' }
                      }}
                    />
                  ))}
                </Box>
                <TextField
                  label={t('platforms.kick.users.inputBox.label')}
                  placeholder={t('platforms.kick.users.inputBox.placeholder')}
                  onChange={(e) => handleInputChange('admin', e.target.value)}
                  value={users.admin}
                  disabled={isValidating.admin}
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUser('admin', users.admin);
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: getInputAdornment('admin', users.admin)
                    }
                  }}
                />
              </Box>
            </CollapsibleCard>

            <CollapsibleCard
              title={t('platforms.kick.users.mods.header')}
              subtitle={t('platforms.kick.users.mods.description')}
              collapsible={false}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ flexWrap: 'wrap', display: 'flex', gap: 1 }}>
                  {modsList.map((mod) => (
                    <Chip
                      key={mod.id}
                      avatar={<Avatar alt={mod.display_name} src={mod.profile_image_url} />}
                      label={mod.display_name}
                      onDelete={() => handleRemoveUser('mod', mod)}
                      variant="outlined"
                      sx={{
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        color: theme.palette.text.primary,
                        border: '1px dashed',
                        borderColor: alpha(theme.palette.text.primary, 0.2),
                        borderRadius: '999px',
                        fontWeight: 600,
                        '& .MuiChip-avatar': {
                          border: '1px solid',
                          borderColor: alpha(theme.palette.text.primary, 0.15)
                        },
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.error.light,
                          '&:hover': {
                            color: theme.palette.error.main
                          }
                        },
                        '& .MuiChip-avatar img': { objectFit: 'cover' }
                      }}
                    />
                  ))}
                </Box>
                <TextField
                  label={t('platforms.kick.users.inputBox.label')}
                  placeholder={t('platforms.kick.users.inputBox.placeholder')}
                  onChange={(e) => handleInputChange('mod', e.target.value)}
                  value={users.mod}
                  disabled={isValidating.mod}
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUser('mod', users.mod);
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: getInputAdornment('mod', users.mod)
                    }
                  }}
                />
              </Box>
            </CollapsibleCard>
          </>
        )}
      </Box>
    </Box>
  );
};

export default KickUserSettings;
