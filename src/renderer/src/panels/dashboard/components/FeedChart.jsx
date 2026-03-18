import React, { useEffect, useMemo, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { useStreamStats } from '../../../contexts/StreamStatsContext.jsx';

const MAX_POINTS = 60;

const FeedChart = () => {
  const theme = useTheme();
  const { stats } = useStreamStats();

  const [history, setHistory] = useState([]);
  const [startTs, setStartTs] = useState(null);
  const [maxY, setMaxY] = useState(0);

  useEffect(() => {
    setHistory((prev) => {
      const now = Date.now();
      if (!startTs) setStartTs(now);
      const next = [...prev, { bitrate: stats.bitrate || 0, rtt: stats.rtt || 0, ts: Date.now() }];
      return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
    });
    setMaxY((prev) => Math.max(prev, stats.bitrate || 0));
  }, [stats.bitrate, stats.rtt, startTs]);

  const { chartData, durationSec } = useMemo(() => {
    if (!history.length || !startTs) return { chartData: [], durationSec: 0 };
    const mapped = history.map((p) => ({ x: (p.ts - startTs) / 1000, y: p.bitrate ?? 0 }));
    const duration = (history[history.length - 1].ts - startTs) / 1000;
    return { chartData: mapped, durationSec: duration };
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
        <Tooltip title="Current bitrate">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <TimelineRoundedIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {`${stats.bitrate ?? 0} kbps`}
            </Typography>
          </Stack>
        </Tooltip>
        <Tooltip title="Current speed (rtt)">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <SpeedRoundedIcon fontSize="small" color="secondary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {`${stats.rtt ?? 0} ms`}
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
                color: theme.palette.primary.main,
                showMark: false,
                label: 'Bitrate (kbps)',
                // area: true
              }
            ]}
            xAxis={[
              {
                  data: chartData.map((p) => p.x),
                scaleType: 'linear',
                  valueFormatter: (v) => formatStopwatch(v),
                  label: 'Elapsed time'
              }
            ]}
            yAxis={[
              {
                min: 0,
                max: maxY || undefined
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
              Waiting for feed data...
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default FeedChart;
