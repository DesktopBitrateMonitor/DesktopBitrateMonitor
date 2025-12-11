import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import styled from '@emotion/styled';
import Dashboard from './pages/Dashboard';
import ChannelSettings from './pannels/twitch/ChannelSettings';
import Welcome from './pages/Welcome';
import ServerSettings from './pannels/server/ServerSettings';
import TwitchSettings from './pannels/twitch/TwitchSettings';
import CommandSettings from './pannels/twitch/CommandSettings';
import MessageSettings from './pannels/twitch/MessageSettings';
import BotSettings from './pannels/twitch/BotSettings';

function App() {
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
              <Route path="channelsettings" element={<ChannelSettings />} />
              <Route path="messagesettings" element={<MessageSettings />} />
              <Route path="botsettings" element={<BotSettings />} />
            </Route>

            {/* /dashboard/serversettings */}
            <Route path="serversettings" element={<ServerSettings />} />
          </Route>
        </Routes>
      </Router>
    </Container>
  );
}

export default App;

const Container = styled.div``;
