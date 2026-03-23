import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import styled from '@emotion/styled';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import ServerSettings from './panels/server/ServerSettings';
import AccountsSettings from './panels/accounts/AccountsSettings';
import TwitchSettings from './panels/twitch/TwitchSettings';
import KickSettings from './panels/kick/KickSettings';
import CommandSettings from './panels/twitch/components/CommandSettings';
import MessageSettings from './panels/twitch/components/MessageSettings';
import TwitchAccountSettings from './panels/twitch/components/AccountsSettings';
import KickAccountSettings from './panels/kick/components/AccountsSettings';
import AppSettings from './panels/app/AppSettings';
import AlertComponent from './components/feedback/AlertComponent';
import { useAlert } from './contexts/AlertContext';
import GeneralSettings from './panels/app/components/GeneralSettings';
import UpdateSettings from './panels/app/components/UpdateSettings';
import StyleSettings from './panels/app/components/StyleSettings';
import SoftwareSettings from './panels/software/SoftwareSettings';
import SwitcherSettings from './panels/switcher/SwitcherSettings';
import LoggingSettings from './panels/logging/LoggingSettings';
import Main from './panels/dashboard/Main';
import TwitchUserSettings from './panels/twitch/components/TwitchUserSettings';
import KickUserSettings from './panels/kick/components/KickUserSettings';
import LoggingFeed from './panels/logging/LoggingFeed';
import UpdateCard from './components/feedback/UpdateCard';
import { useAppConfigStore } from './contexts/DataContext';
import { useEffect, useRef, useState } from 'react';
import { useUpdate } from './contexts/UpdateContext';
import OverlayEditor from './panels/overlay/OverlayEditor';

function App() {
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { status } = useUpdate();
  const { alerts } = useAlert();

  const [openUpdateCard, setOpenUpdateCard] = useState(false);
  const hasAutoChecked = useRef(false);

  // On app start (and when toggled on), auto-check for updates once.
  useEffect(() => {
    if (!appConfig?.autoCheckForUpdates) return;
    if (hasAutoChecked.current) return;
    hasAutoChecked.current = true;
    window.updateApi.checkForUpdates();
    const now = new Date().toISOString();
    updateAppConfig((prev) => ({
      ...prev,
      lastUpdateCheck: now
    }));
    window.storeApi.set('app-config', 'lastUpdateCheck', now);
  }, [appConfig?.autoCheckForUpdates, updateAppConfig]);

  useEffect(() => {
    if (status === 'update-available') {
      setOpenUpdateCard(true);
    }
  }, [status]);

  return (
    <Container>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Main />} />
            <Route path="logs" element={<LoggingFeed />} />

            {/* ACCOUNT SETTINGS */}
            <Route path="accountssettings" element={<AccountsSettings />}>
              <Route index element={<Navigate to="twitch" replace />} />
              <Route path="twitch" element={<TwitchSettings />}>
                <Route index element={<CommandSettings />} />
                <Route path="commandsettings" element={<CommandSettings />} />
                <Route path="messagesettings" element={<MessageSettings />} />
                <Route path="usersettings" element={<TwitchUserSettings />} />
                <Route path="accountssettings" element={<TwitchAccountSettings />} />
              </Route>

              <Route path="kick" element={<KickSettings />}>
                <Route index element={<CommandSettings />} />
                <Route path="commandsettings" element={<CommandSettings />} />
                <Route path="messagesettings" element={<MessageSettings />} />
                <Route path="usersettings" element={<KickUserSettings />} />
                <Route path="accountssettings" element={<KickAccountSettings />} />
              </Route>
            </Route>

            {/* SERVER SETTINGS */}
            <Route path="serversettings" element={<ServerSettings />} />

            {/* SOFTWARE SETTINGS */}
            <Route path="softwaresettings" element={<SoftwareSettings />} />

            {/* SWITCHER SETTINGS */}
            <Route path="switchersettings" element={<SwitcherSettings />} />

            {/* LOGGING SETTINGS */}
            <Route path="loggingsettings" element={<LoggingSettings />} />

            {/* OVERLAY EDITOR */}
            <Route path="overlayeditor" element={<OverlayEditor />} />

            {/* APP SETTINGS */}
            <Route path="appsettings" element={<AppSettings />}>
              <Route index element={<GeneralSettings />} />
              <Route path="generalsettings" element={<GeneralSettings />} />
              <Route
                path="updatesettings"
                element={<UpdateSettings setOpenUpdateCard={setOpenUpdateCard} />}
              />
              <Route path="stylesettings" element={<StyleSettings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <AlertComponent alerts={alerts} />
      <UpdateCard open={openUpdateCard} onClose={() => setOpenUpdateCard(false)} />
    </Container>
  );
}

export default App;

const Container = styled.div``;
