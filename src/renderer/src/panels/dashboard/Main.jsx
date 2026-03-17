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
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ReactGridLayout, {
  useContainerWidth,
  useResponsiveLayout,
  verticalCompactor
} from 'react-grid-layout';

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const colsConfig = { lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 };

const createInitialLayouts = () => ({
  lg: [
    { i: 'feedChart', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'connectionStates', x: 6, y: 0, w: 3, h: 6, minW: 3, minH: 4 },
    { i: 'activePlatform', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 }
  ],
  md: [
    { i: 'feedChart', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'connectionStates', x: 6, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'activePlatform', x: 0, y: 12, w: 10, h: 4, minW: 3, minH: 3 }
  ],
  sm: [
    { i: 'feedChart', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 8 },
    { i: 'connectionStates', x: 0, y: 12, w: 8, h: 6, minW: 3, minH: 4 },
    { i: 'activePlatform', x: 0, y: 18, w: 8, h: 4, minW: 3, minH: 3 }
  ],
  xs: [
    { i: 'feedChart', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'connectionStates', x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'activePlatform', x: 0, y: 18, w: 6, h: 4, minW: 3, minH: 3 }
  ],
  xxs: [
    { i: 'feedChart', x: 0, y: 0, w: 4, h: 12, minW: 3, minH: 8 },
    { i: 'connectionStates', x: 0, y: 12, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'activePlatform', x: 0, y: 18, w: 4, h: 4, minW: 3, minH: 3 }
  ]
});

const Main = () => {
  const { appConfig } = useAppConfigStore();
  const { kickAccountsConfig } = useKickAccountsConfig();
  const { twitchAccountsConfig } = useTwitchAccountsConfig();

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
    compactor,
    onLayoutChange: (nextLayout, nextLayouts) => setLayouts(nextLayouts)
  });

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

  const handleLayoutChange = (nextLayout) => {
    setLayouts((prev) => ({ ...prev, [breakpoint]: nextLayout }));
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
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your current stream status and settings
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
              gridConfig={{ cols, rowHeight: 30, margin: [16, 16] }}
              dragConfig={{ handle: '.draggable-handle' }}
              compactor={compactor}
              onLayoutChange={handleLayoutChange}
            >
              <Box key={'feedChart'} sx={{ height: '100%', minHeight: 0 }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={'Feed Chart'}
                  sx={{ height: '100%' }}
                  content={<FeedChart />}
                />
              </Box>
              <Box key={'connectionStates'} sx={{ height: '100%', minHeight: 0 }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={'Connection States'}
                  sx={{ height: '100%' }}
                  content={<ConnectionStates />}
                />
              </Box>
              <Box key={'activePlatform'} sx={{ height: '100%', minHeight: 0 }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={'Active Platform'}
                  sx={{ height: '100%' }}
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
            </ReactGridLayout>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Main;
