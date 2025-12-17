import { Box, Typography } from '@mui/material';
import React from 'react';

const ObsSettings = () => {
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
            Software Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize the broadcasting software settings.
          </Typography>
        </Box>
      </Box>
      <Box>{/* Content goes here */}</Box>
    </Box>
  );
};

export default ObsSettings;
