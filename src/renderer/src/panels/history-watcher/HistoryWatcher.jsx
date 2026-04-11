import { alpha, Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
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
  const [selectedLogId, setSelectedLogId] = useState(null);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartHeight = Math.max(240, Math.floor(viewportHeight * 0.5));

  useEffect(() => {
    setLogs(logData);
    setSelectedLogId(null);
  }, [logData]);

  const selectedLog = logs.find((log) => log.id === selectedLogId) || null;

  const handleOpenHistoryLog = async () => {
    const res = await window.loggerApi.readSessionLogFile({
      title: t('logging.import.header'),
      filters: [{ name: t('logging.import.filters.name'), extensions: ['jsonl'] }],
      properties: ['openFile']
    });

    if (res.success && res?.data?.length > 0) {
      setLogs(res.data);
      setSelectedLogId(null);
    }
  };

  const handleAxisClick = (_event, axisData) => {
    const dataIndex = axisData?.dataIndex;
    const point = logs[dataIndex];

    if (!point) {
      return;
    }
    console.log(point);
    setSelectedLogId(point.id || null);
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
            <Tooltip title={t('logging.historyWatcher.toolTip')} arrow placement="top">
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
                label: `${t('logging.historyWatcher.y-label')}`,
                showMark: false
              }
            ]}
            onAxisClick={handleAxisClick}
            xAxis={[
              {
                scaleType: 'time',
                label: `🕐 ${t('logging.historyWatcher.x-label')}`,
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
                  max: 4000,
                  color: ['red', 'green']
                },
                label: `🛜 ${t('logging.historyWatcher.y-label')}`
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

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) =>
                alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.35 : 0.6)
            }}
          >
            {!selectedLog ? (
              <Typography variant="body2" color="text.secondary">
                {t('logging.historyWatcher.dataPointBox.noDataSelected')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {!selectedLog.directory_thumbnail ||
                selectedLog.directory_thumbnail === '' ? null : (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {Boolean(selectedLog.directory_thumbnail) && (
                      <img
                        style={{ width: '52px' }}
                        src={selectedLog.directory_thumbnail || null}
                        alt="Log Directory Thumbnail"
                      />
                    )}
                  </Box>
                )}
                <Box>
                  <Typography variant="body2">{`${t('logging.historyWatcher.dataPointBox.title')}: ${selectedLog.title || '-'}`}</Typography>
                  <Typography variant="body2">{`${t('logging.historyWatcher.dataPointBox.primaryInstance')}: ${selectedLog.primaryInstance || '-'}`}</Typography>
                  <Typography variant="body2">{`${t('logging.historyWatcher.dataPointBox.directory')}: ${selectedLog.directory || '-'}`}</Typography>
                  <Typography variant="body2">{`${t('logging.historyWatcher.dataPointBox.bitrate')}: ${selectedLog.bitrate ?? 0} kbps`}</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </CollapsibleCard>
      </Box>
    </Box>
  );
};

export default HistoryWatcher;
