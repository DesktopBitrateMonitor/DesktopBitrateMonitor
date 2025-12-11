import React from 'react';
import SidebarNavigation from '../components/SidebarNavigation';
import { Box, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <SidebarNavigation />

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;
