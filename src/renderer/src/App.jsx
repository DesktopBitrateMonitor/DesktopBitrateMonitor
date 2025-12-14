import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import styled from '@emotion/styled';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import ServerSettings from './panels/server/ServerSettings';
import TwitchSettings from './panels/twitch/TwitchSettings';
import CommandSettings from './panels/twitch/CommandSettings';
import MessageSettings from './panels/twitch/MessageSettings';
import AppSettings from './panels/app/AppSettings';
import AlertComponent from './components/feedback/AlertComponent';
import { useAlert } from './contexts/AlertContext';
import AccountsSettings from './panels/twitch/AccountsSettings';

function App() {
  const { alerts } = useAlert();
  return (
    <Container>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />}>
            {/* /dashboard/twitchsettings and its nested sub-routes */}
            <Route path="twitchsettings" element={<TwitchSettings />}>
              {/* Default sub-route when visiting /dashboard/twitchsettings */}
              <Route index element={<CommandSettings />} />
              <Route path="commandsettings" element={<CommandSettings />} />
              <Route path="messagesettings" element={<MessageSettings />} />
              <Route path="accountssettings" element={<AccountsSettings />} />
            </Route>

            {/* /dashboard/serversettings */}
            <Route path="serversettings" element={<ServerSettings />} />
            <Route path="appsettings" element={<AppSettings />} />
          </Route>
        </Routes>
      </Router>
      <AlertComponent alerts={alerts} />
    </Container>
  );
}

export default App;

const Container = styled.div``;
