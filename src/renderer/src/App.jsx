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
import Main from './panels/dashboard/main';
import TwitchUserSettings from './panels/twitch/components/TwitchUserSettings';
import KickUserSettings from './panels/kick/components/KickUserSettings';

function App() {
  const { alerts } = useAlert();
  return (
    <Container>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Main />} />

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

            <Route
              path="twitchsettings/*"
              element={<Navigate to="/dashboard/accountssettings/twitch" replace />}
            />

            <Route path="serversettings" element={<ServerSettings />} />

            <Route path="appsettings" element={<AppSettings />}>
              <Route index element={<GeneralSettings />} />
              <Route path="generalsettings" element={<GeneralSettings />} />
              <Route path="updatesettings" element={<UpdateSettings />} />
              <Route path="stylesettings" element={<StyleSettings />} />
            </Route>

            <Route path="softwaresettings" element={<SoftwareSettings />} />

            <Route path="switchersettings" element={<SwitcherSettings />} />
            <Route path="loggingsettings" element={<LoggingSettings />} />
          </Route>
        </Routes>
      </Router>
      <AlertComponent alerts={alerts} />
    </Container>
  );
}

export default App;

const Container = styled.div``;
