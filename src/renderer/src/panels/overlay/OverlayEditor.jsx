import { Box, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

const OverlayEditor = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}>
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
            {t('overlayEditor.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('overlayEditor.description')}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 0',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          pt: 2,
          px: 1.5,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <Box
          sx={{
            flex: '1 1 0',
            pt: 2,
            px: 1.5,
            pb: 1.5,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          {/* Overlay editor content goes here */}
        </Box>
      </Box>
    </Box>
  );
};

export default OverlayEditor;
