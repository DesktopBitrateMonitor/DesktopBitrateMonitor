import { Box, Tab, Tabs } from '@mui/material';
import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TuneIcon from '@mui/icons-material/Tune';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useTranslation } from 'react-i18next';
import { Backup } from '@mui/icons-material';

const AppSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const isDev = import.meta.env.DEV;

  const TAB_CONFIG = [
    {
      value: 'generalsettings',
      label: t('appSettings.panels.general'),
      icon: TuneIcon,
      isDev: false
    },
    {
      value: 'stylesettings',
      label: t('appSettings.panels.style'),
      icon: ColorLensIcon,
      isDev: false
    },
    {
      value: 'updatesettings',
      label: t('appSettings.panels.update'),
      icon: SyncAltIcon,
      isDev: false
    },
    {
      value: 'backup',
      label: t('appSettings.panels.backup'),
      icon: Backup,
      isDev: false
    }
  ];

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
        pt: 1.5,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        maxHeight: '100%',
        height: '100%'
      }}
    >
      <Tabs
        value={activeValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        {TAB_CONFIG.map((tab) => {
          if (tab.isDev && !isDev) return null;
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
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          height: '100%'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppSettings;
