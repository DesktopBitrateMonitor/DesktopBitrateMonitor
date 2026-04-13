import React, { useCallback, useEffect } from 'react';
import { useYoutubeAccountsConfig } from '../../../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../../contexts/AlertContext';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import YoutubeAccountsPanel from './panels/YoutubeAccountsPanel';
import { Box, Stack, Switch, Tooltip, Typography } from '@mui/material';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import YoutubeIcon from '../../../assets/icons/YoutubeIcon';

const YoutubeAccountsSettings = () => {
  const { youtubeAccountsConfig, updateYoutubeAccountsConfig } = useYoutubeAccountsConfig();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [broadcasterData, setBroadcasterData] = React.useState(null);
  const [chatbotData, setChatbotData] = React.useState(null);
  const [layoutMode, setLayoutMode] = React.useState(youtubeAccountsConfig?.layout || 'list');
  const [collapsedIds, setCollapsedIds] = React.useState([]);

  useEffect(() => {
    const storedLayout = youtubeAccountsConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('list');
    }

    setBroadcasterData(youtubeAccountsConfig?.broadcaster);
    setChatbotData(youtubeAccountsConfig?.bot);

    const savedCollapsed = Array.isArray(youtubeAccountsConfig?.collapsed)
      ? youtubeAccountsConfig.collapsed
      : [];
    setCollapsedIds(savedCollapsed);

    // Listen for OAuth data updates and update the frontend state accordingly
    window.authApi.setYoutubeOauthData((data) => {
      if (data.userType === 'broadcaster') {
        setBroadcasterData(data.data);
        showAlert({
          message: t('platforms.youtube.accounts.broadcasterConnected'),
          severity: 'success'
        });
      } else if (data.userType === 'bot') {
        setChatbotData(data.data);
        showAlert({
          message: t('platforms.youtube.accounts.chatbotConnected'),
          severity: 'success'
        });
      }
      updateYoutubeAccountsConfig((prev) => ({
        ...(prev || {}),
        [data.userType]: data.data
      }));
    });
  }, [youtubeAccountsConfig]);

  const handleLayoutChange = useCallback(
    async (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      setLayoutMode(nextLayout);
      updateYoutubeAccountsConfig((prev) => ({ ...(prev || {}), layout: nextLayout }));
      await window.storeApi.set('youtube-accounts-config', 'layout', nextLayout);
    },
    [youtubeAccountsConfig, updateYoutubeAccountsConfig]
  );

  const toggleCollapsed = useCallback(
    async (accountType) => {
      const next = collapsedIds.includes(accountType)
        ? collapsedIds.filter((id) => id !== accountType)
        : [...collapsedIds, accountType];
      setCollapsedIds(next);

      updateYoutubeAccountsConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('youtube-accounts-config', 'collapsed', next);
    },
    [collapsedIds, updateYoutubeAccountsConfig]
  );

  const handleLogin = useCallback(async (accountType) => {
    await window.authApi.startYoutubeAuthProcess(accountType);
  }, []);

  const handleLogout = useCallback(
    async (accountType) => {
      const res = await window.authApi.revokeYoutubeAccessToken(accountType);

      if (res) {
        const userData = {
          id: '',
          login: '',
          display_name: '',
          access_token: '',
          customUrl: '',
          refresh_token: '',
          expiry_date: null,
          scopes: [],
          profile_image_url: ''
        };

        await window.storeApi.set(`youtube-accounts-config`, accountType, userData);

        updateYoutubeAccountsConfig((prev) => ({
          ...(prev || {}),
          [accountType]: userData
        }));

        if (accountType === 'broadcaster') {
          setBroadcasterData(userData);
        } else if (accountType === 'bot') {
          setChatbotData(userData);
        }

        showAlert({
          message:
            accountType === 'broadcaster'
              ? t('platforms.youtube.accounts.loggedOutBroadcaster')
              : t('platforms.youtube.accounts.loggedOutChatbot'),
          severity: 'success'
        });
      }
    },
    [youtubeAccountsConfig, updateYoutubeAccountsConfig]
  );

  const handleSwitchChange = useCallback(
    async (event) => {
      const useBot = event.target.checked;

      const res = await window.storeApi.set('youtube-accounts-config', 'useBotAccount', useBot);
      if (res.success) {
        showAlert({
          message: useBot
            ? t('platforms.youtube.accounts.enabledChatbot')
            : t('platforms.youtube.accounts.disabledChatbot'),
          severity: 'success'
        });
      } else {
        showAlert({
          message: t('platforms.youtube.accounts.failure'),
          severity: 'error'
        });
      }

      updateYoutubeAccountsConfig((prev) => ({
        ...(prev || {}),
        useBotAccount: useBot
      }));
    },
    [youtubeAccountsConfig, updateYoutubeAccountsConfig]
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <YoutubeIcon />
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {t('platforms.youtube.accounts.header')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('platforms.youtube.accounts.description')}
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
          title={t('platforms.youtube.accounts.broadcaster.header')}
          subtitle={t('platforms.youtube.accounts.broadcaster.description')}
          collapsible={layoutMode === 'list'}
          expanded={!collapsedIds.includes('broadcaster')}
          onExpandedChange={() => toggleCollapsed('broadcaster')}
        >
          <YoutubeAccountsPanel
            data={broadcasterData}
            accountType="broadcaster"
            login={() => handleLogin('broadcaster')}
            logout={() => handleLogout('broadcaster')}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title={t('platforms.youtube.accounts.chatbot.header')}
          subtitle={t('platforms.youtube.accounts.chatbot.description')}
          actions={
            <Box>
              <Tooltip title={t('platforms.youtube.accounts.chatbot.hint')}>
                <Typography variant="body2" color="text.secondary"></Typography>
                <Switch
                  checked={youtubeAccountsConfig.useBotAccount}
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
          <YoutubeAccountsPanel
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

export default YoutubeAccountsSettings;
