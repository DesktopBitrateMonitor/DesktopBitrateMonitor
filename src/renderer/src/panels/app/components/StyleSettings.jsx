import { Box, Typography } from '@mui/material';
import React from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { useTranslation } from 'react-i18next';

const StyleSettings = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <CollapsibleCard
        title={t('appSettings.style.header')}
        subtitle={t('appSettings.style.description')}
        collapsible={false}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ThemeSelector />
        </Box>
      </CollapsibleCard>
    </Box>
  );
};

export default StyleSettings;
