import {
  alpha,
  Box,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CollapsibleCard from '../../components/functional/CollapsibleCard';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { LineChart } from '@mui/x-charts';
import { useTranslation } from 'react-i18next';

const HistoryWatcher = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const location = useLocation();
  const logData = location.state?.logData || [];

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartHeight = Math.max(240, Math.floor(viewportHeight * 0.6));

  useEffect(() => {
    setLogs(logData);
  }, [logData]);

  const handleOpenHistoryLog = async () => {
    const res = await window.loggerApi.readSessionLogFile({
      title: t('logging.import.header'),
      filters: [{ name: t('logging.import.filters.name'), extensions: ['jsonl'] }],
      properties: ['openFile']
    });

    if (res.success && res?.data?.length > 0) {
      setLogs(res.data);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {t('logging.historyWatcher.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('logging.historyWatcher.description')}
          </Typography>
        </Box>
      </Box>
      <Box>
        <CollapsibleCard
          title={t('logging.historyWatcher.currentLog.header')}
          subtitle={t('logging.historyWatcher.currentLog.description')}
          collapsible={false}
          defaultExpanded={true}
          actions={
            <Tooltip title={t('logging.historyWatcher.currentLog.toolTip')} arrow placement="top">
              <IconButton onClick={() => handleOpenHistoryLog()} size="small">
                <FileOpenOutlinedIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <LineChart
            height={chartHeight}
            skipAnimation
            series={[
              {
                data: logs.map((log) => log.bitrate),
                showMark: false,
                label: 'Bitrate (kbps)'
              }
            ]}
            xAxis={[
              {
                scaleType: 'time',
                data: logs.map((log) => new Date(log.ts))
              }
            ]}
            yAxis={[
              {
                min: 0,
                max:
                  logs.length > 0 ? Math.max(...logs.map((log) => log.bitrate)) + 500 : undefined,
                colorMap: {
                  type: 'continuous',
                  min: 0,
                  max: 6500,
                  color: ['red', 'green']
                }
              }
            ]}
            grid={{ vertical: true, horizontal: true }}
            sx={{
              width: '100%',
              '& .MuiAreaElement-root': {
                fill: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.18)
              }
            }}
          />
        </CollapsibleCard>
      </Box>
    </Box>
  );
};

export default HistoryWatcher;
