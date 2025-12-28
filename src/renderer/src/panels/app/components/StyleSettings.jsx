import { Box, Typography } from '@mui/material';
import React from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';

const StyleSettings = () => {
  return (
    <CollapsibleCard
      title="Style Settings"
      subtitle="Customize the appearance of the application."
      collapsible={false}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ThemeSelector />
      </Box>
    </CollapsibleCard>
  );
};

export default StyleSettings;
