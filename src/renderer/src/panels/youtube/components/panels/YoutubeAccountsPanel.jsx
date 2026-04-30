import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useAlert } from '../../../../contexts/AlertContext';
import { useYoutubeAccountsConfig } from '../../../../contexts/DataContext';

const YoutubeAccountsPanel = ({ data, accountType, login, logout }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { youtubeAccountsConfig, updateYoutubeAccountsConfig } = useYoutubeAccountsConfig();
  const [broadcasterData, setBroadcasterData] = useState(null);
  const [channelInput, setChannelInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    setBroadcasterData(data);
  }, [data]);

  const handleValidateAndLogin = async () => {
    if (!channelInput.trim().replace(/\s/g, '')) {
      setValidationError(t('platforms.youtube.accounts.channelNameRequired'));
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await window.authApi.validateYoutubeChannelByName(channelInput);

      if (result.success && result.data?.id) {
        await window.storeApi.set('youtube-accounts-config', 'broadcaster', {
          ...data,
          id: result.data.id,
          display_name: result.data.display_name,
          login: result.data.login,
          customUrl: result.data.customUrl,
          profile_image_url: result.data.profile_image_url
        });

        setBroadcasterData((prev) => ({
          ...prev,
          id: result.data.id,
          display_name: result.data.display_name,
          login: result.data.login,
          customUrl: result.data.customUrl,
          profile_image_url: result.data.profile_image_url
        }));

        updateYoutubeAccountsConfig((prev) => ({
          ...(prev || {}),
          ...prev?.broadcaster,
          id: result.data.id,
          display_name: result.data.display_name,
          login: result.data.login,
          customUrl: result.data.customUrl,
          profile_image_url: result.data.profile_image_url
        }));

        showAlert({
          message: t('platforms.youtube.accounts.channelValidated'),
          severity: 'success'
        });
        setChannelInput('');
        await login('broadcaster');
      } else {
        setValidationError(result.error || t('platforms.youtube.accounts.channelNotFound'));
        showAlert({
          message: result.error || t('platforms.youtube.accounts.channelNotFound'),
          severity: 'error'
        });
      }
    } catch (error) {
      showAlert({
        message: error.message || t('platforms.youtube.accounts.validationError'),
        severity: 'error'
      });
      setValidationError(error.message || t('platforms.youtube.accounts.validationError'));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Stack>
      {accountType === 'broadcaster' ? (
        <Stack direction={'column'} alignItems={'center'} justifyContent={'center'} gap={2}>
          {broadcasterData?.id === '' && (
            <Stack sx={{ gap: 1.5 }}>
              <TextField
                size="small"
                placeholder={t('platforms.youtube.accounts.enterChannelName')}
                value={channelInput}
                onChange={(e) => {
                  setChannelInput(e.target.value);
                  setValidationError(null);
                }}
                disabled={isValidating || (broadcasterData?.id ? true : false)}
                error={!!validationError}
              />
            </Stack>
          )}

          {broadcasterData?.id && (
            <Stack direction={'column'} alignItems={'center'} justifyContent={'center'} gap={2}>
              <Stack alignItems="center" gap={1}>
                <Avatar
                  src={broadcasterData?.profile_image_url}
                  alt={broadcasterData?.profile_image_url}
                  sx={{ width: 64, height: 64 }}
                />
                <Stack textAlign={'center'} justifyContent="center">
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {broadcasterData?.display_name || t('platforms.youtube.accounts.notLoggedIn')}
                    <Typography variant="body2" color="text.secondary">
                      {t('platforms.youtube.accounts.broadcaster.header')}
                    </Typography>
                  </Typography>
                </Stack>
                <Button sx={{ mt: 1 }} variant="outlined" color="error" onClick={logout}>
                  {t('platforms.youtube.accounts.button.logout')}
                </Button>
              </Stack>
            </Stack>
          )}

          {!broadcasterData?.id && (
            <Button
              color="youtube"
              variant="contained"
              onClick={handleValidateAndLogin}
              disabled={isValidating || !channelInput.trim()}
              sx={{
                position: 'relative',
                mt: 1,
                color: 'text'
              }}
            >
              {isValidating ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-10px'
                    }}
                  />
                  <span style={{ opacity: 0 }}>{t('platforms.youtube.accounts.button.login')}</span>
                </>
              ) : (
                t('platforms.youtube.accounts.button.login')
              )}
            </Button>
          )}
        </Stack>
      ) : (
        // Chatbot Account Layout
        <Box>
          {data?.id ? (
            <Stack direction={'row'} alignItems={'center'} justifyContent={'center'}>
              <Stack alignItems="center" gap={1}>
                <Avatar
                  src={data.profile_image_url}
                  alt={data.profile_image_url}
                  sx={{ width: 64, height: 64 }}
                />
                <Stack textAlign={'center'} justifyContent="center">
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {data.display_name || t('platforms.youtube.accounts.notLoggedIn')}
                    <Typography variant="body2" color="text.secondary">
                      {t('platforms.youtube.accounts.chatbot.header')}
                    </Typography>
                  </Typography>
                </Stack>
                <Button sx={{ mt: 3 }} variant="outlined" color="error" onClick={logout}>
                  {t('platforms.youtube.accounts.button.logout')}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {t('platforms.youtube.accounts.notLoggedIn')}
              </Typography>
              <Button
                color="youtube"
                variant="contained"
                onClick={login}
                sx={{ mt: 2, color: 'text' }}
              >
                {t('platforms.youtube.accounts.button.login')}
              </Button>
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default YoutubeAccountsPanel;
