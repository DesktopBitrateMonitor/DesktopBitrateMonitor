import { Button } from '@mui/material';
import React, { useEffect } from 'react';
import { useAppConfigStore } from '../../contexts/DataContext';
import ConnectionStates from './components/ConnectionStates';

const Main = () => {
  const { appConfig, updateAppConfig } = useAppConfigStore();

  const [path, setPath] = React.useState(appConfig?.sessionLogsPath);
  const [content, setContent] = React.useState();

  const types = ['info', 'warning', 'error'];

  const appendContent = {
    id: Math.floor(Math.random() * 10000),
    timestamp: new Date().toISOString(),
    type: types[Math.floor(Math.random() * types.length)],
    event: 'Sample log event for appending with the id: ' + Math.floor(Math.random() * 1000)
  };

  useEffect(() => {
    setContent({
      id: Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      type: 'info',
      event: 'Dashboard Loaded'
    });
  }, [appConfig]);

  const handleCreateLogFile = async ({ path, fileName, content }) => {
    try {
      const fullPath = `${path}/${fileName}`;
      const result = await window.loggerApi.createLogFile(fullPath, content);
      console.log('Log file created at:', result);
    } catch (error) {
      console.error('Error creating log file:', error);
    }
  };
  const handleReadLogFile = async ({ path }) => {
    try {
      const result = await window.loggerApi.readLogFile(path);
      console.log('Log file read:', result);
    } catch (error) {
      console.error('Error reading log file:', error);
    }
  };

  return (
    <div>
      <h1>Dashboard Main Panel</h1>
      {/* <Button
        onClick={() => handleCreateLogFile({ path: path, fileName: 'test.txt', content: content })}
      >
        Create Log File
      </Button>
      <Button onClick={() => handleReadLogFile({ path: path + '/test.txt' })}>Read Log File</Button> */}

      <ConnectionStates />
    </div>
  );
};

export default Main;
