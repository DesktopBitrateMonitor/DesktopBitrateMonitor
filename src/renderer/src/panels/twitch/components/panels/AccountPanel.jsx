import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import React from 'react';

const AccountPanel = ({ data, accountType, login, logout }) => {
  const {t} = useTranslation();
  return (
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
                {data.display_name || t('platforms.twitch.accounts.notLoggedIn')}
                <Typography variant="body2" color="text.secondary">
                  {accountType === 'broadcaster' ? t('platforms.twitch.accounts.broadcaster.header') : t('platforms.twitch.accounts.chatbot.header')}
                </Typography>
              </Typography>
            </Stack>
            <Button sx={{ mt: 3 }} variant="outlined" color="error" onClick={logout}>
              {t('platforms.twitch.accounts.button.logout')}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {t('platforms.twitch.accounts.notLoggedIn')}
          </Typography>
          <Button variant="contained" onClick={login} sx={{ mt: 2 }}>
            {t('platforms.twitch.accounts.button.login')}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default AccountPanel;
