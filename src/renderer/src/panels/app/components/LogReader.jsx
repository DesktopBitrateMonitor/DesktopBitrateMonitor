import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const LogReader = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleLoadLogsFile = async () => {
    setLoading(true);
    try {
      const options = {
        title: 'Select Log File',
        filters: [
          { name: 'Log Files', extensions: ['log', 'txt', 'jsonl'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      };

      const res = await window?.loggerApi.readActionsLogFile(options);
      if (res?.success) {
        console.log('Log file content:', res.data);
        setLogs(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'rowIndex', headerName: '#', width: 70, sortable: false },
    { field: 'id', headerName: 'ID', width: 100, hide: true },
    { field: 'ts', headerName: 'Timestamp', width: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'message', headerName: 'Message', flex: 1, minWidth: 300 }
  ];

  const processedLogs = logs.map((log, index) => {
    const logData = typeof log === 'string' ? JSON.parse(log) : log;
    return {
      id: index,
      rowIndex: index + 1,
      ...logData,
      ts: new Date(logData.ts).toLocaleString()
    };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: 2 }}>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} /> : <UploadFileIcon />}
        onClick={handleLoadLogsFile}
        disabled={loading}
        sx={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Loading...' : 'Load Log File'}
      </Button>

      <Box sx={{ flex: 1, width: '100%' }}>
        <DataGrid
          rows={processedLogs}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 100 }
            }
          }}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              fontSize: '0.875rem'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default LogReader;
