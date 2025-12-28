import { Box, Tab, Tabs } from '@mui/material';
import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TuneIcon from '@mui/icons-material/Tune';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ColorLensIcon from '@mui/icons-material/ColorLens';

const TAB_CONFIG = [
  { value: 'generalsettings', label: 'General', icon: TuneIcon },
  { value: 'stylesettings', label: 'Style', icon: ColorLensIcon },
  { value: 'updatesettings', label: 'Updates', icon: SyncAltIcon }
];

const AppSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeValue = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';

    if (last === 'appsettings') return 'generalsettings';

    return TAB_CONFIG.some((t) => t.value === last) ? last : 'generalsettings';
  }, [location.pathname]);

  const handleChange = (_event, newValue) => {
    if (newValue === 'generalsettings') {
      navigate('.', { replace: false });
    } else {
      navigate(newValue, { replace: false });
    }
  };

  return (
    <Box
      component={'main'}
      sx={{
        flex: '1 1 0',
        p: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        maxHeight: '100%'
      }}
    >
      <Tabs
        value={activeValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 1
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500, minHeight: 44 }}
            />
          );
        })}
      </Tabs>
      <Box
        sx={{
          flex: '1 1 0',
          pt: 2,
          px: 1.5,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppSettings;
