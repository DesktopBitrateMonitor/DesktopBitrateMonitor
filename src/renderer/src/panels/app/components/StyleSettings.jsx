import { Box, Typography } from '@mui/material';
import React from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { useTranslation } from 'react-i18next';

const StyleSettings = () => {
  const { t } = useTranslation();
  return (
    <CollapsibleCard
      title={t('appSettings.style.header')}
      subtitle={t('appSettings.style.description')}
      collapsible={false}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ThemeSelector />
      </Box>
    </CollapsibleCard>
  );
};

export default StyleSettings;
