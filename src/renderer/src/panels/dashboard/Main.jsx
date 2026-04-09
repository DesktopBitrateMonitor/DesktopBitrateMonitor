import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material';
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
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
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

const isDev = import.meta.env.DEV;

const breakpoints = { lg: 1400, md: 996, sm: 768, xs: 480, xxs: 0 };
const colsConfig = { lg: 16, md: 10, sm: 8, xs: 6, xxs: 6 };

const createInitialLayouts = () => ({
  ...defaultLayout
});

const Main = () => {
  const { t } = useTranslation();
  const { appConfig, updateAppConfig } = useAppConfigStore();
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
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [elementsMenuAnchor, setElementsMenuAnchor] = useState(null);
  const [lockLayoutState, setLockLayoutState] = useState(true);
  const [showHandles, setShowHandles] = useState(false);

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
    updateAppConfig((prev) => ({
      ...prev,
      layout: { ...prev.layout, dashboardLayout: nextLayout }
    }));
  };

  const handleOpenContextMenu = (event) => {
    event.preventDefault();
    setContextMenuPosition({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
    setElementsMenuAnchor(null);
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
    setElementsMenuAnchor(null);
  };

  const handleOpenElementsMenu = (event) => setElementsMenuAnchor(event.currentTarget);
  const handleCloseElementsMenu = () => {
    setContextMenuPosition(null);
    setElementsMenuAnchor(null);
  };

  const toggleLockLayout = () => {
    const nextLockState = !lockLayoutState;

    setLayouts((prev) => {
      const nextLayouts = Object.fromEntries(
        Object.entries(prev || {}).map(([key, items]) => [
          key,
          items.map((item) => ({ ...item, static: nextLockState }))
        ])
      );
      return nextLayouts;
    });

    setShowHandles(!nextLockState);
    setLockLayoutState(nextLockState);
  };

  const handleOpenHistoryLog = async () => {
    const res = await window.loggerApi.readSessionLogFile({
      title: t('logging.import.header'),
      filters: [{ name: t('logging.import.filters.name'), extensions: ['jsonl'] }],
      properties: ['openFile']
    });

    if (res.success && res?.data?.length > 0) {
      handleRouteToHistoryWatcher(res.data);
    }
  };

  const handleRouteToHistoryWatcher = (logData) => {
    navigate('/dashboard/history-watcher', { state: { logData } });
  };

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}
      onContextMenu={handleOpenContextMenu}
    >
      <Menu
        open={Boolean(contextMenuPosition)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenuPosition
            ? { top: contextMenuPosition.mouseY, left: contextMenuPosition.mouseX }
            : undefined
        }
      >
        <ListSubheader>{t('dashboard.contextMenu.header')}</ListSubheader>
        <Divider variant="middle" sx={{ mb: 1 }} />
        <MenuItem
          aria-haspopup="true"
          onMouseEnter={handleOpenElementsMenu}
          onClick={handleOpenElementsMenu}
        >
          <ListItemIcon>
            <ViewComfyIcon />
          </ListItemIcon>
          <ListItemText>
            {t('dashboard.contextMenu.toggleLayoutAdjustment', {
              defaultValue: 'Elements'
            })}
          </ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={elementsMenuAnchor}
        open={Boolean(elementsMenuAnchor)}
        onClose={handleCloseElementsMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          list: {
            onMouseLeave: handleCloseElementsMenu
          }
        }}
      >
        <MenuItem onClick={() => toggleLockLayout()}>
          <ListItemIcon>{lockLayoutState ? <LockOpenIcon /> : <LockIcon />}</ListItemIcon>
          <ListItemText>
            {lockLayoutState
              ? t('dashboard.contextMenu.unlockLayout')
              : t('dashboard.contextMenu.lockLayout')}
          </ListItemText>
        </MenuItem>
      </Menu>
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
                  actions={
                    <Tooltip title={t('logging.historyWatcher.toolTip')} arrow placement="top">
                      <IconButton onClick={() => handleOpenHistoryLog()} size="small">
                        <FileOpenOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  }
                  showHandles={showHandles}
                  sx={{ height: '100%' }}
                  content={<FeedChart />}
                />
              </Box>
              <Box key={'connectionStates'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.connectionStates.header')}
                  showHandles={showHandles}
                  sx={{ height: '100%' }}
                  content={<ConnectionStates />}
                />
              </Box>

              <Box key={'activePlatform'} sx={{ height: '100%' }}>
                <InfoCard
                  className={'draggable-handle'}
                  title={t('dashboard.activePlatform.header')}
                  showHandles={showHandles}
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
                  showHandles={showHandles}
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
