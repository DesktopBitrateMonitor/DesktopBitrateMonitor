import React, { Fragment, useState } from 'react';
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
  Tooltip,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThemeSelector from '../ThemeSelector';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import TwitchIcon from '../../assets/icons/TwitchIcon';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorageIcon from '@mui/icons-material/Storage';
import Settings from '@mui/icons-material/Settings';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: SpaceDashboardOutlinedIcon, matchPrefix: false },
  {
    label: 'Twitch Settings',
    path: '/dashboard/twitchsettings',
    icon: TwitchIcon,
    matchPrefix: true
  },
  {
    label: 'Server Settings',
    path: '/dashboard/serversettings',
    icon: StorageIcon,
    matchPrefix: false
  },
  { label: 'App Settings', path: '/dashboard/appsettings', icon: Settings, matchPrefix: false }
];

const DRAWER_WIDTH = {
  expanded: 240,
  collapsed: 72
};

const SidebarNavigation = ({ initialCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // TODO: Use state from store data
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const drawerWidth = collapsed ? DRAWER_WIDTH.collapsed : DRAWER_WIDTH.expanded;
  const widthTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter
  });
  const spacingTransition = theme.transitions.create(['padding', 'margin', 'border-radius'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter
  });

  const handleNavigate = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  return (
    <Box
      component="nav"
      sx={{ width: drawerWidth, flexShrink: 0, transition: widthTransition, position: 'relative' }}
    >
      <Drawer
        variant="permanent"
        open
        PaperProps={{
          sx: {
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            transition: widthTransition
          }
        }}
        sx={{ flexShrink: 0, '& .MuiDrawer-paper': { overflowX: 'hidden' } }}
      >
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
              Bitrate Monitor
            </Typography>
          )}

          <IconButton
            size="small"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        <Divider flexItem />
        <ThemeSelector />

        <List
          disablePadding
          sx={{
            mt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              : location.pathname === item.path;

            const navButton = (
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 2.5,
                  py: 1,
                  borderRadius: collapsed ? '50%' : 2,
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
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }}
                  />
                )}
              </ListItemButton>
            );

            return (
              <Fragment key={item.path}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right" arrow>
                    {navButton}
                  </Tooltip>
                ) : (
                  navButton
                )}
              </Fragment>
            );
          })}
        </List>
      </Drawer>
    </Box>
  );
};

export default SidebarNavigation;
