import { Box, Tab, Tabs } from '@mui/material';
import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EmojiMessagesIcon from '@mui/icons-material/QuestionAnswerOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const TAB_CONFIG = [
  { value: 'commandsettings', label: 'Commands', icon: ChatBubbleOutlineIcon },
  { value: 'messagesettings', label: 'Messages', icon: EmojiMessagesIcon },
  { value: 'accountssettings', label: 'Accounts', icon: AccountCircleIcon }
];

const TwitchSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeValue = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';

    // When at /dashboard/twitchsettings (index route), default to commands
    if (last === 'twitchsettings') return 'commandsettings';

    return TAB_CONFIG.some((t) => t.value === last) ? last : 'commandsettings';
  }, [location.pathname]);

  const handleChange = (_event, newValue) => {
    // Commands is the default: use index route when selecting it
    if (newValue === 'commandsettings') {
      navigate('.', { replace: false });
    } else {
      navigate(newValue, { replace: false });
    }
  };

  return (
    <Box
      component="main"
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

export default TwitchSettings;
