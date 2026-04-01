import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AllInclusiveRoundedIcon from '@mui/icons-material/AllInclusiveRounded';
import { useStreamStats } from '../../../contexts/StreamStatsContext.jsx';
import { useTranslation } from 'react-i18next';
import { useConnectionStates } from '../../../contexts/ConnectionStatesContext.jsx';
import { useLoggingConfigStore } from '../../../contexts/DataContext.jsx';

const isDev = import.meta.env.DEV;

const MAX_POINTS = 60;

const FeedChart = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { stats, totalUptime } = useStreamStats();
  const { broadcastState } = useConnectionStates();
  const [history, setHistory] = useState([]);
  const [startTs, setStartTs] = useState(null);
  const [maxY, setMaxY] = useState(0);

  const statsPayloadRef = useRef([]);
  const previousBroadcastStateRef = useRef(broadcastState);

  const flushStatsPayload = useCallback(async () => {
    if (!statsPayloadRef.current.length) {
      return;
    }

    const payloadToFlush = statsPayloadRef.current;
    statsPayloadRef.current = [];
    const res =await window.loggerApi.writeToLogFile(payloadToFlush);

    console.log(res);
  }, []);

  useEffect(() => {
    setHistory((prev) => {
      const now = Date.now();
      if (!startTs) setStartTs(now);
      const next = [...prev, { bitrate: stats.bitrate || 0, rtt: stats.rtt || 0, ts: Date.now() }];

      return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
    });
    setMaxY((prev) => Math.max(prev, stats.bitrate || 0));
  }, [stats.bitrate, stats.rtt, startTs]);

  useEffect(() => {
    const handleLogging = async () => {
      // if (!broadcastState ) {
      //   return;
      // }

      statsPayloadRef.current = [...statsPayloadRef.current, { ...stats, ts: Date.now() }];

      if (statsPayloadRef.current.length >= 20) {
        await flushStatsPayload();
      }
    };

    handleLogging();
  }, [broadcastState, flushStatsPayload, stats]);

  useEffect(() => {
    const previousBroadcastState = previousBroadcastStateRef.current;

    if (previousBroadcastState !== broadcastState) {
      flushStatsPayload();
      previousBroadcastStateRef.current = broadcastState;
    }
  }, [broadcastState, flushStatsPayload]);

  useEffect(() => {
    flushStatsPayload();
  }, [flushStatsPayload]);

  useEffect(() => {
    return () => {
      flushStatsPayload();
    };
  }, [flushStatsPayload]);

  const chartData = useMemo(() => {
    if (!history.length || !startTs) return [];
    return history.map((p) => ({ x: (p.ts - startTs) / 1000, y: p.bitrate ?? 0 }));
  }, [history, startTs]);

  const formatStopwatch = (seconds) => {
    const total = Math.max(seconds, 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    const two = (n) => n.toString().padStart(2, '0');
    return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
  };

  return (
    <div>
      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip title={t('dashboard.feedChart.bitrateToolTip')} arrow>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <TimelineRoundedIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {`${stats.bitrate ?? 0} kbps`}
            </Typography>
          </Stack>
        </Tooltip>
        <Tooltip title={t('dashboard.feedChart.speedToolTip')} arrow>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <SpeedRoundedIcon fontSize="small" color="secondary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {`${stats.rtt.toFixed(2) ?? 0} ms`}
            </Typography>
          </Stack>
        </Tooltip>

        <Tooltip title={t('dashboard.feedChart.uptimeToolTip') || 'Stream uptime'} arrow>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <ScheduleRoundedIcon fontSize="small" color="success" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatStopwatch(stats.uptime ?? 0)}
            </Typography>
          </Stack>
        </Tooltip>

        <Tooltip
          title={t('dashboard.feedChart.totalUptimeToolTip') || 'Total uptime (this session)'}
          arrow
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <AllInclusiveRoundedIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatStopwatch(totalUptime)}
            </Typography>
          </Stack>
        </Tooltip>
      </Stack>

      <Box>
        {chartData.length ? (
          <LineChart
            height={300}
            skipAnimation
            series={[
              {
                data: chartData.map((p) => p.y),
                showMark: false,
                label: 'Bitrate (kbps)'
              }
            ]}
            // xAxis={[{}]}
            yAxis={[
              {
                min: 0,
                max: maxY + 1000 || undefined,
                colorMap: {
                  type: 'continuous',
                  min: 0,
                  max: 6500 || undefined,
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
        ) : (
          <Box
            sx={{
              height: 260,
              width: '100%',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.6),
              display: 'grid',
              placeItems: 'center',
              backgroundColor: alpha(
                theme.palette.background.default,
                theme.palette.mode === 'dark' ? 0.35 : 0.5
              )
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.feedChart.noData')}
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default FeedChart;
