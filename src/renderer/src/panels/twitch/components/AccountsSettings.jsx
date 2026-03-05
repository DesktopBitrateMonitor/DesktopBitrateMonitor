import { Box, Stack, Switch, Tooltip, Typography } from '@mui/material';
import React, { use, useCallback, useEffect } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import { useTwitchAccountsConfig } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import AccountPanel from './panels/AccountPanel';
import { useTranslation } from 'react-i18next';

const AccountsSettings = () => {
  const { twitchAccountsConfig, updateTwitchAccountsConfig } = useTwitchAccountsConfig();

  const { t } = useTranslation();

  const { showAlert } = useAlert();

  const [broadcasterData, setBroadcasterData] = React.useState(null);
  const [chatbotData, setChatbotData] = React.useState(null);
  const [layoutMode, setLayoutMode] = React.useState('grid');
  const [collapsedIds, setCollapsedIds] = React.useState([]);

  useEffect(() => {
    const storedLayout = twitchAccountsConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('list');
    }

    setBroadcasterData(twitchAccountsConfig?.broadcaster);
    setChatbotData(twitchAccountsConfig?.bot);

    const savedCollapsed = Array.isArray(twitchAccountsConfig?.collapsed)
      ? twitchAccountsConfig.collapsed
      : [];
    setCollapsedIds(savedCollapsed);

    // Listen for OAuth data updates and update the frontend state accordingly
    window.authApi.setOauthData((data) => {
      if (data.userType === 'broadcaster') {
        setBroadcasterData(data.data);
        showAlert({
          message: t('platforms.twitch.accounts.broadcasterConnected'),
          severity: 'success'
        });
      } else if (data.userType === 'bot') {
        setChatbotData(data.data);
        showAlert({
          message: t('platforms.twitch.accounts.chatbotConnected'),
          severity: 'success'
        });
      }

      updateTwitchAccountsConfig((prev) => ({
        ...(prev || {}),
        [data.userType]: data.data
      }));
    });
  }, [twitchAccountsConfig]);

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      setLayoutMode(nextLayout);
      updateTwitchAccountsConfig((prev) => ({ ...(prev || {}), layout: nextLayout }));
      window.storeApi.set('twitch-accounts-config', 'layout', nextLayout);
    },
    [twitchAccountsConfig, updateTwitchAccountsConfig]
  );

  const toggleCollapsed = useCallback(
    async (accountType) => {
      const next = collapsedIds.includes(accountType)
        ? collapsedIds.filter((id) => id !== accountType)
        : [...collapsedIds, accountType];
      setCollapsedIds(next);

      updateTwitchAccountsConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('twitch-accounts-config', 'collapsed', next);
    },
    [collapsedIds, updateTwitchAccountsConfig]
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

        showAlert({
          message: accountType === "broadcaster" ? t('platforms.twitch.accounts.loggedOutBroadcaster') : t('platforms.twitch.accounts.loggedOutChatbot'),
          severity: 'success'
        });

        await window.storeApi.set(`twitch-accounts-config`, accountType, data);

        if (accountType === 'broadcaster') {
          setBroadcasterData(null);
          // Disable chatbot usage when broadcaster logs out
          await window.storeApi.set('twitch-accounts-config', 'useBotAccount', false);
          updateTwitchAccountsConfig((prev) => ({
            ...(prev || {}),
            [accountType]: data,
            useBotAccount: false
          }));
        } else {
          setChatbotData(null);
          updateTwitchAccountsConfig((prev) => ({
            ...(prev || {}),
            [accountType]: data
          }));
        }
      }
    },
    [chatbotData, broadcasterData, twitchAccountsConfig, updateTwitchAccountsConfig]
  );

  const handleSwitchChange = useCallback(
    async (event) => {
      const useBot = event.target.checked;

      const res = await window.storeApi.set('twitch-accounts-config', 'useBotAccount', useBot);
      if (res.success) {
        showAlert({
          message: useBot ? t('platforms.twitch.accounts.enabledChatbot') : t('platforms.twitch.accounts.disabledChatbot'),
          severity: 'success'
        });
      } else {
        showAlert({
          message: t('platforms.twitch.accounts.failure'),
          severity: 'error'
        });
      }

      updateTwitchAccountsConfig((prev) => ({
        ...(prev || {}),
        useBotAccount: useBot
      }));
    },
    [twitchAccountsConfig, updateTwitchAccountsConfig]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
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
                  checked={twitchAccountsConfig.useBotAccount}
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
