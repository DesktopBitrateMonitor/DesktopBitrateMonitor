import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import React from 'react';

const AccountPanel = ({ data, accountType, login, logout, deleteAccount }) => {
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
                {data.display_name || 'Not logged in'}
                <Typography variant="body2" color="text.secondary">
                  {accountType === 'broadcaster' ? 'Broadcaster Account' : 'Chatbot Account'}
                </Typography>
              </Typography>
            </Stack>
            <Button sx={{ mt: 3 }} variant="outlined" color="error" onClick={logout}>
              Logout
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            Not logged in
          </Typography>
          <Button variant="contained" onClick={login} sx={{ mt: 2 }}>
            Login to Twitch
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default AccountPanel;
