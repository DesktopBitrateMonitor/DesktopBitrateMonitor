import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Tooltip,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ComputerIcon from '@mui/icons-material/Computer';
import SyncIcon from '@mui/icons-material/Sync';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorageIcon from '@mui/icons-material/Storage';
import Settings from '@mui/icons-material/Settings';
import FeedIcon from '@mui/icons-material/Feed';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useAppConfigStore } from '../../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import ConnectionStates from '../../panels/dashboard/components/ConnectionStates';
import TwitchIcon from '../../assets/icons/TwitchIcon';

const ACCOUNTS_PATH = '/dashboard/accountssettings';
const NAV_ITEMS = [
  {
    translationKey: 'navigation.dashboard',
    path: '/dashboard',
    icon: SpaceDashboardOutlinedIcon,
    matchPrefix: false
  },
  {
    translationKey: 'navigation.platformsSettings',
    path: ACCOUNTS_PATH,
    icon: ManageAccountsIcon,
    matchPrefix: true
  },
  {
    translationKey: 'navigation.serverSettings',
    path: '/dashboard/serversettings',
    icon: StorageIcon,
    matchPrefix: false
  },
  {
    translationKey: 'navigation.softwareSettings',
    path: '/dashboard/softwaresettings',
    icon: ComputerIcon,
    matchPrefix: false
  },
  {
    translationKey: 'navigation.switcherSettings',
    path: '/dashboard/switchersettings',
    icon: SyncIcon,
    matchPrefix: false
  },
  {
    translationKey: 'navigation.loggingSettings',
    path: '/dashboard/loggingsettings',
    icon: FeedIcon,
    matchPrefix: false
  },
  {
    translationKey: 'navigation.appSettings',
    path: '/dashboard/appsettings',
    icon: Settings,
    matchPrefix: true
  }
];

const PLATFORM_ROUTES = [
  { label: 'Twitch', path: `${ACCOUNTS_PATH}/twitch`, icon: TwitchIcon },
  { label: 'YouTube (coming soon)', path: `${ACCOUNTS_PATH}/youtube`, icon: YouTubeIcon, disabled: true },
  { label: 'Kick (coming soon)', path: `${ACCOUNTS_PATH}/kick`, icon: SportsEsportsIcon, disabled: true }
];

const DRAWER_WIDTH = {
  expanded: 240,
  collapsed: 72
};

const SidebarNavigation = ({ initialCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const { appConfig, updateAppConfig } = useAppConfigStore();

  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [statsAnchorEl, setStatsAnchorEl] = useState(null);
  const [accountsAnchorEl, setAccountsAnchorEl] = useState(null);
  const drawerWidth = collapsed ? DRAWER_WIDTH.collapsed : DRAWER_WIDTH.expanded;
  const widthTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter
  });
  const spacingTransition = theme.transitions.create(['padding', 'margin', 'border-radius'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter
  });

  useEffect(() => {
    setCollapsed(appConfig?.layout?.sidebarCollapsed || false);
  }, [appConfig?.layout?.sidebarCollapsed]);

  const handleNavigate = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  const isStatsMenuOpen = Boolean(statsAnchorEl);
  const handleOpenStatsMenu = (event) => {
    setStatsAnchorEl(event.currentTarget);
  };
  const handleCloseStatsMenu = () => {
    setStatsAnchorEl(null);
  };

  const isAccountsMenuOpen = Boolean(accountsAnchorEl);
  const handleToggleAccountsMenu = (event) => {
    const target = event.currentTarget;
    setAccountsAnchorEl((prev) => (prev ? null : target));
  };
  const handleCloseAccountsMenu = () => {
    setAccountsAnchorEl(null);
  };
  const handleSelectPlatform = (path) => {
    navigate(path);
    handleCloseAccountsMenu();
  };

  const handleCollapsedChange = useCallback(
    async (nextCollapsed) => {
      setCollapsed(nextCollapsed);
      updateAppConfig((prev) => ({
        ...(prev || {}),
        layout: {
          ...(prev?.layout || {}),
          sidebarCollapsed: nextCollapsed
        }
      }));

      await window.storeApi.set('app-config', 'layout.sidebarCollapsed', nextCollapsed);
    },
    [updateAppConfig]
  );

  return (
    <Box
      component="nav"
      sx={{ width: drawerWidth, flexShrink: 0, transition: widthTransition, position: 'relative' }}
    >
      <Drawer
        variant="permanent"
        open
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              transition: widthTransition
            }
          }
        }}
        sx={{ flexShrink: 0, '& .MuiDrawer-paper': { overflowX: 'hidden' } }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                px: collapsed ? 1 : 2,
                py: 2,
                transition: spacingTransition
              }}
            >
              {!collapsed && (
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {t('navigation.brand')}
                </Typography>
              )}

              <IconButton size="small" onClick={() => handleCollapsedChange(!collapsed)}>
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>

            <Divider flexItem orientation="horizontal" />

            <List
              disablePadding
              sx={{
                mt: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minHeight: 0,
                overflowY: 'auto'
              }}
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPrefix
                  ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  : location.pathname === item.path;

                const isAccountsItem = item.path === ACCOUNTS_PATH;
                const navButton = (
                  <ListItemButton
                    onClick={(event) =>
                      isAccountsItem ? handleToggleAccountsMenu(event) : handleNavigate(item.path)
                    }
                    selected={isActive}
                    sx={{
                      minHeight: 48,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 0 : 2.5,
                      py: 1,
                      borderRadius: 2,
                      mx: collapsed ? 'auto' : 1,
                      width: collapsed ? 48 : 'auto',
                      transition: spacingTransition
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: collapsed ? 0 : 2,
                        color: isActive ? 'primary.main' : 'text.secondary',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        transition: spacingTransition,
                        '& .MuiSvgIcon-root': {
                          fontSize: 26
                        }
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={t(item.translationKey)}
                        slotProps={{
                          primary: { fontWeight: isActive ? 600 : 500 }
                        }}
                      />
                    )}
                  </ListItemButton>
                );

                return (
                  <Fragment key={item.path}>
                    {collapsed ? (
                      <Tooltip title={t(item.translationKey)} placement="right" arrow>
                        {navButton}
                      </Tooltip>
                    ) : (
                      navButton
                    )}
                  </Fragment>
                );
              })}
            </List>

            <Popover
              open={isAccountsMenuOpen}
              anchorEl={accountsAnchorEl}
              onClose={handleCloseAccountsMenu}
              keepMounted
              anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
              transformOrigin={{ vertical: 'center', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    ml: 1,
                    p: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: 'none',
                    minWidth: 240
                  }
                }
              }}
            >
              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {PLATFORM_ROUTES.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <ListItemButton
                      key={platform.path}
                      disabled={platform.disabled}
                      onClick={() => handleSelectPlatform(platform.path)}
                      sx={{ borderRadius: 1, px: 1.5, py: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={platform.label} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Popover>
          </Box>

          <Box>
            <Divider flexItem orientation="horizontal" sx={{ mt: 1 }} />

            <Box sx={{ p: 1 }}>
              {collapsed ? (
                <Tooltip title="Stats" placement="right" arrow>
                  <IconButton
                    aria-label="Open stats menu"
                    onClick={handleOpenStatsMenu}
                    sx={{
                      display: 'flex',
                      mx: 'auto',
                      width: 48,
                      height: 48,
                      borderRadius: 2
                    }}
                  >
                    <InsightsOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <ListItemButton
                  aria-label="Open stats menu"
                  onClick={handleOpenStatsMenu}
                  selected={isStatsMenuOpen}
                  sx={{
                    minHeight: 48,
                    justifyContent: 'flex-start',
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    mx: 1,
                    transition: spacingTransition
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 2,
                      color: isStatsMenuOpen ? 'primary.main' : 'text.secondary',
                      '& .MuiSvgIcon-root': { fontSize: 26 }
                    }}
                  >
                    <InsightsOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Connections" slotProps={{ primary: { fontWeight: 500 } }} />
                </ListItemButton>
              )}
            </Box>
          </Box>

          <Popover
            open={isStatsMenuOpen}
            anchorEl={statsAnchorEl}
            onClose={handleCloseStatsMenu}
            keepMounted
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: -1,
                  ml: 1,
                  p: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundImage: 'none',
                  width: { xs: 320, sm: 560 },
                  maxWidth: 'calc(100vw - 96px)'
                }
              }
            }}
          >
            <ConnectionStates isMenu/>
          </Popover>
        </Box>
      </Drawer>
    </Box>
  );
};

export default SidebarNavigation;
