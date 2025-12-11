import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useData } from '../contexts/DataContenxt';

const Welcome = () => {
  const navigate = useNavigate();
  const [isBootLoading, setIsBootLoading] = useState(true);

  const data = useData();

  console.log('ServerSettings data', data);

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
          Desktop Bitrate Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Initializing data sources... the dashboard will appear automatically when the startup
          checks finish.
        </Typography>

        {isBootLoading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary">
              Loading experience (5s)
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default Welcome;
