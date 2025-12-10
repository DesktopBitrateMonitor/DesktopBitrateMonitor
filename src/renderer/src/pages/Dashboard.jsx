import React from 'react';
import SidebarNavigation from '../components/SidebarNavigation';
import { Box, Typography } from '@mui/material';

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
      <SidebarNavigation active="overview" />

      <Box component="main">
        <Typography variant="h4" fontWeight={600} sx={{ p: 3 }}>
          Dashboard
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
