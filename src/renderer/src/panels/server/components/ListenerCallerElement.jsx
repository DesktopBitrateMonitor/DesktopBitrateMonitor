import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ListenerCallerElement = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mt: 5, ml: 'auto', mb: 5, mr: 'auto', textAlign: 'center', maxWidth: '70%' }}
      >
        {t('server.listenerCaller.content')}
      </Typography>
    </Box>
  );
};

export default ListenerCallerElement;
