import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  useAppConfigStore,
  useKickAccountsConfig,
  useTwitchAccountsConfig
} from '../../contexts/DataContext';
import ConnectionStates from './components/ConnectionStates';
import FeedChart from './components/FeedChart';
import InfoCard from './components/InfoCard';
import TwitchIcon from '../../assets/icons/TwitchIcon';
import KickIcon from '../../assets/icons/KickIcon';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../assets/custom-grid-styles.css';
import ReactGridLayout, {
  useContainerWidth,
  useResponsiveLayout,
  verticalCompactor
} from 'react-grid-layout';
import { defaultLayout } from './components/layout-default';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const breakpoints = { lg: 1400, md: 996, sm: 768, xs: 480, xxs: 0 };
const colsConfig = { lg: 16, md: 10, sm: 8, xs: 6, xxs: 6 };

const createInitialLayouts = () => ({
  ...defaultLayout
});

const Main = () => {
  const { t } = useTranslation();
  const { appConfig } = useAppConfigStore();
  const { kickAccountsConfig } = useKickAccountsConfig();
  const { twitchAccountsConfig } = useTwitchAccountsConfig();
  const navigate = useNavigate();

  const { width, containerRef, mounted } = useContainerWidth();

  const [layouts, setLayouts] = useState(createInitialLayouts);
  const [compactor] = useState(verticalCompactor);

  const [activePlatform, setActivePlatform] = React.useState('');
  const [kickBroadcaster, setKickBroadcaster] = React.useState('');
  const [twitchBroadcaster, setTwitchBroadcaster] = React.useState('');
  const [broadcasterConnected, setBroadcasterConnected] = React.useState(false);

  const { layout, breakpoint, cols } = useResponsiveLayout({
    width,
    breakpoints,
    cols: colsConfig,
    layouts,
    compactor
  });

  useEffect(() => {
    if (!appConfig) return;

    setActivePlatform(appConfig.activePlatform);
    setKickBroadcaster(kickAccountsConfig?.broadcaster?.display_name);
    setTwitchBroadcaster(twitchAccountsConfig?.broadcaster?.display_name);

    if (appConfig.activePlatform === 'kick') {
      setBroadcasterConnected(kickAccountsConfig?.broadcaster?.login !== '');
    }

    if (appConfig.activePlatform === 'twitch') {
      setBroadcasterConnected(twitchAccountsConfig?.broadcaster?.login !== '');
    }

    const storedLayouts = appConfig.layout?.dashboardLayout;
    if (storedLayouts && !Array.isArray(storedLayouts)) {
      setLayouts((prev) => ({ ...prev, ...storedLayouts }));
    }
  }, [appConfig, kickAccountsConfig, twitchAccountsConfig]);

  const handleLayoutChange = (nextLayout) => {
    setLayouts((prev) => {
      const nextLayouts = { ...prev, [breakpoint]: nextLayout };
      window.storeApi.set('app-config', 'layout.dashboardLayout', nextLayouts);
      return nextLayouts;
    });
  };

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
            {t('dashboard.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.description')}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 0',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          pt: 2,

          px: 1.5,
          pb: 3,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <Box ref={containerRef}>
          {mounted && (
            <ReactGridLayout
              width={width}
              layout={layout}
              gridConfig={{ cols, rowHeight: 24, margin: [16, 16] }}
              dragConfig={{ handle: '.draggable-handle' }}
              compactor={compactor}
              onLayoutChange={handleLayoutChange}
            >
              <Box key={'feedChart'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.feedChart.header')}
                  sx={{ height: '100%' }}
                  content={<FeedChart />}
                />
              </Box>
              <Box key={'connectionStates'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.connectionStates.header')}
                  sx={{ height: '100%' }}
                  content={<ConnectionStates />}
                />
              </Box>

              <Box key={'activePlatform'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.activePlatform.header')}
                  sx={{ height: '100%' }}
                  content={
                    <Box display="flex" flexDirection={'column'} alignItems="center" gap={1}>
                      <>
                        {activePlatform === 'twitch' ? (
                          <TwitchIcon height={48} width={48} />
                        ) : (
                          <KickIcon height={48} width={48} />
                        )}
                      </>
                      {!broadcasterConnected ? (
                        <Typography variant="body1" textAlign={'center'}>
                          {t('dashboard.activePlatform.noData')}
                        </Typography>
                      ) : (
                        <Typography variant="h6" color="text.primary">
                          {activePlatform === 'twitch' ? twitchBroadcaster : kickBroadcaster}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Box>

              <Box key={'logs'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.logs.header')}
                  sx={{ height: '100%' }}
                  content={
                    <Box
                      display="flex"
                      flexDirection={'column'}
                      alignItems="center"
                      gap={1}
                      height="100%"
                      justifyContent="center"
                      onClick={() => navigate('/dashboard/logs')}
                    >
                      <ReceiptLongIcon sx={{ cursor: 'pointer', height: 104, fontSize: 64 }} />
                    </Box>
                  }
                />
              </Box>
            </ReactGridLayout>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Main;
