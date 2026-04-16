import { Box, Stack, Switch, Tooltip, Typography } from '@mui/material';
import React, { use, useCallback, useEffect } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import { useKickAccountsConfig } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import AccountPanel from './panels/AccountPanel';
import { useTranslation } from 'react-i18next';
import KickIcon from '../../../assets/icons/KickIcon';

const AccountsSettings = () => {
  const { kickAccountsConfig, updateKickAccountsConfig } = useKickAccountsConfig();
  const { t } = useTranslation();

  const { showAlert } = useAlert();

  const [broadcasterData, setBroadcasterData] = React.useState(null);
  const [chatbotData, setChatbotData] = React.useState(null);
  const [layoutMode, setLayoutMode] = React.useState(kickAccountsConfig?.layout || 'list');
  const [collapsedIds, setCollapsedIds] = React.useState([]);

  useEffect(() => {
    const storedLayout = kickAccountsConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('list');
    }

    setBroadcasterData(kickAccountsConfig?.broadcaster);
    setChatbotData(kickAccountsConfig?.bot);

    const savedCollapsed = Array.isArray(kickAccountsConfig?.collapsed)
      ? kickAccountsConfig.collapsed
      : [];
    setCollapsedIds(savedCollapsed);

    // Listen for OAuth data updates and update the frontend state accordingly
    window.authApi.setKickOauthData((data) => {
      if (data.userType === 'broadcaster') {
        setBroadcasterData(data.data);
        showAlert({
          message: t('platforms.kick.accounts.broadcasterConnected'),
          severity: 'success'
        });
      } else if (data.userType === 'bot') {
        setChatbotData(data.data);
        showAlert({
          message: t('platforms.kick.accounts.chatbotConnected'),
          severity: 'success'
        });
      }

      updateKickAccountsConfig((prev) => ({
        ...(prev || {}),
        [data.userType]: data.data
      }));
    });
  }, [kickAccountsConfig]);

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      setLayoutMode(nextLayout);
      updateKickAccountsConfig((prev) => ({ ...(prev || {}), layout: nextLayout }));
      window.storeApi.set('kick-accounts-config', 'layout', nextLayout);
    },
    [kickAccountsConfig, updateKickAccountsConfig]
  );

  const toggleCollapsed = useCallback(
    async (accountType) => {
      const next = collapsedIds.includes(accountType)
        ? collapsedIds.filter((id) => id !== accountType)
        : [...collapsedIds, accountType];
      setCollapsedIds(next);

      updateKickAccountsConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('kick-accounts-config', 'collapsed', next);
    },
    [collapsedIds, updateKickAccountsConfig]
  );

  const handleLogin = async (accountType) => {
    await window.authApi.startKickAuthProcess(accountType);
  };

  const handleLogout = useCallback(
    async (accountType) => {
      const res = await window.authApi.revokeKickAccessToken(accountType);

      if (res.status === 200) {
        const data = {
          id: '',
          login: '',
          display_name: '',
          access_token: '',
          refresh_token: '',
          scopes: [],
          profile_image_url: '',
          ...(accountType === 'broadcaster' ? { channelId: '', chatroomId: '' } : {})
        };

        showAlert({
          message:
            accountType === 'broadcaster'
              ? t('platforms.kick.accounts.loggedOutBroadcaster')
              : t('platforms.kick.accounts.loggedOutChatbot'),
          severity: 'success'
        });

        await window.storeApi.set(`kick-accounts-config`, accountType, data);

        if (accountType === 'broadcaster') {
          setBroadcasterData(null);
          // Disable chatbot usage when broadcaster logs out
          await window.storeApi.set('kick-accounts-config', 'useBotAccount', false);
          updateKickAccountsConfig((prev) => ({
            ...(prev || {}),
            [accountType]: data,
            useBotAccount: false
          }));
        } else {
          setChatbotData(null);
          updateKickAccountsConfig((prev) => ({
            ...(prev || {}),
            [accountType]: data
          }));
        }
      }
    },
    [chatbotData, broadcasterData, kickAccountsConfig, updateKickAccountsConfig]
  );

  const handleSwitchChange = useCallback(
    async (event) => {
      const useBot = event.target.checked;

      const res = await window.storeApi.set('kick-accounts-config', 'useBotAccount', useBot);
      if (res.success) {
        showAlert({
          message: useBot
            ? t('platforms.kick.accounts.enabledChatbot')
            : t('platforms.kick.accounts.disabledChatbot'),
          severity: 'success'
        });
      } else {
        showAlert({
          message: t('platforms.kick.accounts.failure'),
          severity: 'error'
        });
      }

      updateKickAccountsConfig((prev) => ({
        ...(prev || {}),
        useBotAccount: useBot
      }));
    },
    [kickAccountsConfig, updateKickAccountsConfig]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 3
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <KickIcon />
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {t('platforms.kick.accounts.header')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('platforms.kick.accounts.description')}
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
          title={t('platforms.kick.accounts.broadcaster.header')}
          subtitle={t('platforms.kick.accounts.broadcaster.description')}
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
          title={t('platforms.kick.accounts.chatbot.header')}
          subtitle={t('platforms.kick.accounts.chatbot.description')}
          actions={
            <Box>
              <Tooltip title={t('platforms.kick.accounts.chatbot.hint')}>
                <Typography variant="body2" color="text.secondary"></Typography>
                <Switch
                  checked={kickAccountsConfig.useBotAccount}
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
