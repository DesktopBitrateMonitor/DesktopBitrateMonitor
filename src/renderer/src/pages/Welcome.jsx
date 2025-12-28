import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Welcome = () => {
  const navigate = useNavigate();
  const [isBootLoading, setIsBootLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBootLoading(false);
      navigate('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        p: 4
      }}
    >
      <Stack spacing={4} alignItems="center" maxWidth={460} textAlign="center">
        <Typography variant="h3" fontWeight={600}>
          {t('welcome.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('welcome.description')}
        </Typography>

        {isBootLoading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary">
              {t('welcome.loading')}
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default Welcome;
