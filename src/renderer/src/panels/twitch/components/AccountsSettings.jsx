import { Box, Stack, Switch, Tooltip, Typography } from '@mui/material';
import React, { use, useCallback, useEffect } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import { useData } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import AccountPanel from './panels/AccountPanel';

const AccountsSettings = () => {
  const {
    data: { accountsConfig },
    updateStoreLocally
  } = useData();

  const { showAlert } = useAlert();

  const [broadcasterData, setBroadcasterData] = React.useState(null);
  const [chatbotData, setChatbotData] = React.useState(null);
  const [layoutMode, setLayoutMode] = React.useState('grid');
  const [collapsedIds, setCollapsedIds] = React.useState([]);

  useEffect(() => {
    const storedLayout = accountsConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('list');
    }

    setBroadcasterData(accountsConfig?.broadcaster);
    setChatbotData(accountsConfig?.bot);

    const savedCollapsed = Array.isArray(accountsConfig?.collapsed) ? accountsConfig.collapsed : [];
    setCollapsedIds(savedCollapsed);

    // Listen for OAuth data updates and update the frontend state accordingly
    window.authApi.setOauthData((data) => {
      if (data.userType === 'broadcaster') {
        setBroadcasterData(data.data);
      } else if (data.userType === 'bot') {
        setChatbotData(data.data);
      }

      updateStoreLocally('accountsConfig', {
        ...accountsConfig,
        [data.userType]: data.data
      });
    });
  }, [accountsConfig]);

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      console.log(nextLayout);
      setLayoutMode(nextLayout);
      updateStoreLocally('accountsConfig', { ...accountsConfig, layout: nextLayout });
      window.storeApi.set('accounts-config', 'layout', nextLayout);
    },
    [accountsConfig, updateStoreLocally]
  );

  const toggleCollapsed = useCallback(
    async (accountType) => {
      const next = collapsedIds.includes(accountType)
        ? collapsedIds.filter((id) => id !== accountType)
        : [...collapsedIds, accountType];
      setCollapsedIds(next);

      updateStoreLocally('accountsConfig', (prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('accounts-config', 'collapsed', next);
    },
    [collapsedIds, updateStoreLocally]
  );

  const handleLogin = async (accountType) => {
    await window.authApi.startAuthProcess(accountType);
  };

  const handleLogout = useCallback(
    async (accountType) => {
      const res = await window.authApi.revokeAccessToken(accountType);

      if (res.status === 400) {
        const data = {
          id: '',
          login: '',
          display_name: '',
          access_token: '',
          refresh_token: '',
          scopes: [],
          profile_image_url: ''
        };

        await window.storeApi.set(`accounts-config`, accountType, data);

        if (accountType === 'broadcaster') {
          setBroadcasterData(null);
          // Disable chatbot usage when broadcaster logs out
          await window.storeApi.set('accounts-config', 'useBotAccount', false);
          updateStoreLocally('accountsConfig', {
            ...accountsConfig,
            [accountType]: data,
            useBotAccount: false
          });
        } else {
          setChatbotData(null);
          updateStoreLocally('accountsConfig', {
            ...accountsConfig,
            [accountType]: data
          });
        }
      }
    },
    [chatbotData, broadcasterData, accountsConfig, updateStoreLocally]
  );

  const handleSwitchChange = useCallback(
    async (event) => {
      const useBot = event.target.checked;

      const res = await window.storeApi.set('accounts-config', 'useBotAccount', useBot);
      if (res.success) {
        showAlert({
          message: `Successfully ${useBot ? 'enabled' : 'disabled'} chatbot account usage.`,
          severity: 'success'
        });
      } else {
        showAlert({
          message: `Failed to ${useBot ? 'enable' : 'disable'} chatbot account usage.`,
          severity: 'error'
        });
      }

      updateStoreLocally('accountsConfig', {
        ...accountsConfig,
        useBotAccount: useBot
      });
    },
    [accountsConfig, updateStoreLocally]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
            Account Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign up and manage your Twitch accounts used for chatbot and broadcasting
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns:
            layoutMode === 'list'
              ? { xs: '1fr' }
              : {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(3, minmax(0, 1fr))'
                }
        }}
      >
        <CollapsibleCard
          title={'Broadcaster'}
          subtitle={'Login your broadcaster account here'}
          collapsible={layoutMode === 'list'}
          expanded={!collapsedIds.includes('broadcaster')}
          onExpandedChange={() => toggleCollapsed('broadcaster')}
        >
          <AccountPanel
            data={broadcasterData}
            accountType="broadcaster"
            login={() => handleLogin('broadcaster')}
            logout={() => handleLogout('broadcaster')}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title={'Chatbot'}
          subtitle={'Login your chatbot account here'}
          actions={
            <Box>
              <Tooltip title={'Use the chatbot account to post messages in the chat'}>
                <Typography variant="body2" color="text.secondary"></Typography>
                <Switch
                  checked={accountsConfig.useBotAccount}
                  onChange={handleSwitchChange}
                  disabled={!broadcasterData?.id}
                />
              </Tooltip>
            </Box>
          }
          collapsible={layoutMode === 'list'}
          expanded={!collapsedIds.includes('bot')}
          onExpandedChange={() => toggleCollapsed('bot')}
        >
          <AccountPanel
            data={chatbotData}
            accountType="bot"
            login={() => handleLogin('bot')}
            logout={() => handleLogout('bot')}
          />
        </CollapsibleCard>
      </Box>
    </Box>
  );
};

export default AccountsSettings;
