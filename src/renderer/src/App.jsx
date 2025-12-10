import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import styled from '@emotion/styled';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';

function App() {
  return (
    <Container>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </Router>
    </Container>
  );
}

export default App;

const Container = styled.div``;
