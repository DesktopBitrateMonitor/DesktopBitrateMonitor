import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import styled from '@emotion/styled';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import ServerSettings from './panels/server/ServerSettings';
import TwitchSettings from './panels/twitch/TwitchSettings';
import CommandSettings from './panels/twitch/components/CommandSettings';
import MessageSettings from './panels/twitch/components/MessageSettings';
import AccountsSettings from './panels/twitch/components/AccountsSettings';
import AppSettings from './panels/app/AppSettings';
import AlertComponent from './components/feedback/AlertComponent';
import { useAlert } from './contexts/AlertContext';
import GeneralSettings from './panels/app/components/GeneralSettings';
import UpdateSettings from './panels/app/components/UpdateSettings';
import StyleSettings from './panels/app/components/StyleSettings';
import SoftwareSettings from './panels/software/SoftwareSettings';
import SwitcherSettings from './panels/switcher/SwitcherSettings';
import LoggingSettings from './panels/logging/LoggingSettings';

function App() {
  const { alerts } = useAlert();
  return (
    <Container>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="twitchsettings" element={<TwitchSettings />}>
              <Route index element={<CommandSettings />} />
              <Route path="commandsettings" element={<CommandSettings />} />
              <Route path="messagesettings" element={<MessageSettings />} />
              <Route path="accountssettings" element={<AccountsSettings />} />
            </Route>

            <Route path="serversettings" element={<ServerSettings />} />

            <Route path="appsettings" element={<AppSettings />}>
              <Route index element={<GeneralSettings />} />
              <Route path="generalsettings" element={<GeneralSettings />} />
              <Route path="updatesettings" element={<UpdateSettings />} />
              <Route path="stylesettings" element={<StyleSettings />} />
            </Route>

            <Route path="softwaresettings" element={<SoftwareSettings />} />

            <Route path="switchersettings" element={<SwitcherSettings />} />
            <Route path="logginsettings" element={<LoggingSettings />} />
          </Route>
        </Routes>
      </Router>
      <AlertComponent alerts={alerts} />
    </Container>
  );
}

export default App;

const Container = styled.div``;
