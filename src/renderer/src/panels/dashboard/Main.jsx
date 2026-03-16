import { Box, Button, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import {
  useAppConfigStore,
  useKickAccountsConfig,
  useTwitchAccountsConfig
} from '../../contexts/DataContext';
import ConnectionStates from './components/ConnectionStates';
import FeedChart from './components/FeedChart';
import { useNavigate } from 'react-router-dom';
import InfoCard from './components/InfoCard';
import TwitchIcon from '../../assets/icons/TwitchIcon';
import KickIcon from '../../assets/icons/KickIcon';

const isDev = import.meta.env.DEV;

const Main = () => {
  const { appConfig } = useAppConfigStore();
  const { kickAccountsConfig } = useKickAccountsConfig();
  const { twitchAccountsConfig } = useTwitchAccountsConfig();

  const [activePlatform, setActivePlatform] = React.useState('');
  const [kickBroadcaster, setKickBroadcaster] = React.useState('');
  const [twitchBroadcaster, setTwitchBroadcaster] = React.useState('');
  const [broadcasterConnected, setBroadcasterConnected] = React.useState(false);
  const [content, setContent] = React.useState();

  useEffect(() => {
    setContent({
      id: Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      type: 'info',
      event: 'Dashboard Loaded'
    });
  }, [appConfig]);

  useEffect(() => {
    setActivePlatform(appConfig?.activePlatform);
    setKickBroadcaster(kickAccountsConfig?.broadcaster?.display_name);
    setTwitchBroadcaster(twitchAccountsConfig?.broadcaster?.display_name);
    if (appConfig?.activePlatform === 'kick') {
      setBroadcasterConnected(kickAccountsConfig?.broadcaster?.login !== '');
    }

    if (appConfig?.activePlatform === 'twitch') {
      setBroadcasterConnected(twitchAccountsConfig?.broadcaster?.login !== '');
    }
  }, [kickAccountsConfig, twitchAccountsConfig, appConfig.activePlatform]);

  const navigate = useNavigate();
  const showLogs = () => navigate('/dashboard/logs');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Dashboard Main Panel
        </Typography>
        {isDev && <Button onClick={() => showLogs()}>Show Logs</Button>}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
        <InfoCard title={'Feed Chart'} content={<FeedChart />} />
        <InfoCard title={'Connection States'} content={<ConnectionStates />} />

        <InfoCard
          title={'Active Platform'}
          content={
            <Box display="flex" flexDirection={'column'} alignItems="center" gap={1}>
              {broadcasterConnected ? (
                <>
                  {activePlatform === 'twitch' ? (
                    <TwitchIcon height={48} width={48} />
                  ) : (
                    <KickIcon height={48} width={48} />
                  )}
                </>
              ) : (
                <Typography variant="body1" textAlign={'center'}>
                  No broadcaster connected <br /> for the selected platform
                </Typography>
              )}
              <Typography variant="h6" color="text.primary">
                {activePlatform === 'twitch' ? twitchBroadcaster : kickBroadcaster}
              </Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
};

export default Main;
