import { Box } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

const AccountsSettings = () => {
  return (
    <Box
      component="main"
      sx={{
        flex: '1 1 0',
        p: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        maxHeight: '100%',
        height: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0',
          pt: 2,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          height: '100%'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AccountsSettings;
