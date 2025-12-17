import { Box, Typography } from '@mui/material';
import React from 'react';
import ThemeSelector from '../../../components/ThemeSelector';

const StyleSettings = () => {
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
            Style Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize the appearance of the application.
          </Typography>
        </Box>
      </Box>
      <Box>
        <ThemeSelector />
      </Box>
    </Box>
  );
};

export default StyleSettings;
