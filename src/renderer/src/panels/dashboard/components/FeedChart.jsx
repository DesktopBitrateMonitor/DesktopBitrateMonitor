import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { useStreamStats } from '../../../contexts/StreamStatsContext.jsx';
import generateId from '../../../../../scripts/lib/id-generator.js';

const CHART_WIDTH = 360;
const CHART_HEIGHT = 220;
const Y_TICKS = 5;
const X_TICKS = 5;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 56 };

const niceStep = (rawStep) => {
  if (!isFinite(rawStep) || rawStep <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const scaled = rawStep / power;
  if (scaled >= 5) return 5 * power;
  if (scaled >= 2) return 2 * power;
  return 1 * power;
};

const buildTicks = (min, max, count) => {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) {
    return [min];
  }
  const rawStep = (max - min) / Math.max(count - 1, 1);
  const step = niceStep(rawStep);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step / 2; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }
  return ticks;
};

const formatSeconds = (sec) => {
  if (!isFinite(sec)) return '0s';
  if (sec >= 120) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m${s ? `${s}s` : ''}`;
  }
  if (sec >= 10) return `${Math.round(sec)}s`;
  return `${sec.toFixed(1)}s`;
};

const buildPath = (points, width, height, min, max) => {
  if (!points.length) return '';
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const range = Math.max(max - min, 1);
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

  return points
    .map((p, idx) => {
      const x = MARGIN.left + idx * stepX;
      const normY = (p.bitrate - min) / range;
      const y = MARGIN.top + innerH - normY * innerH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const FeedChart = () => {
  const theme = useTheme();
  const { stats } = useStreamStats();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, { bitrate: stats.bitrate || 0, rtt: stats.rtt || 0, ts: Date.now() }];
      const maxPoints = 60;
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
  }, [stats.bitrate, stats.rtt]);

  const yValues = history.map((p) => p.bitrate ?? 0);
  const yMin = yValues.length ? Math.min(...yValues, 0) : 0;
  const yMax = yValues.length ? Math.max(...yValues, 1) : 1;
  const yRange = Math.max(yMax - yMin, 1);
  const yTicks = buildTicks(yMin, yMax, Y_TICKS);
  const chartPath = useMemo(
    () => buildPath(history, CHART_WIDTH, CHART_HEIGHT, yMin, yMax),
    [history, yMin, yMax]
  );

  const firstTs = history[0]?.ts;
  const lastTs = history[history.length - 1]?.ts;
  const durationSec = firstTs && lastTs ? Math.max((lastTs - firstTs) / 1000, 0) : 0;
  const xTicks = durationSec > 0 ? buildTicks(0, durationSec, X_TICKS) : [0];

  const border = theme.palette.divider;
  const accent = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12);

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: border,
        background: (t) =>
          t.palette.mode === 'dark'
            ? `radial-gradient(circle at top left, ${accent}, ${alpha(t.palette.background.paper, 0.92)} 45%)`
            : `radial-gradient(circle at top left, ${accent}, ${alpha(t.palette.background.paper, 0.98)} 55%)`,
        boxShadow: (t) =>
          `0 16px 42px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.42 : 0.16)}`,
        minWidth: 320,
        width: '100%'
      }}
    >
      <Box sx={{ position: 'relative', p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.palette.primary.main,
                boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.12)}`
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Stream Feed
            </Typography>
          </Stack>

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
        </Stack>

        <Box sx={{ mt: 2, position: 'relative' }}>
          <Box
            component="svg"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            sx={{
              width: '100%',
              height: 240,
              backgroundColor: alpha(
                theme.palette.background.default,
                theme.palette.mode === 'dark' ? 0.35 : 0.5
              ),
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.6)
            }}
          >
            <defs>
              <linearGradient id="feedChartLine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.9" />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <g>
              {yTicks.map((tick) => {
                const yPos =
                  MARGIN.top +
                  (1 - (tick - yMin) / yRange) * (CHART_HEIGHT - MARGIN.top - MARGIN.bottom);
                return (
                  <line
                    key={`y-${generateId(32)}`}
                    x1={MARGIN.left}
                    x2={CHART_WIDTH - MARGIN.right}
                    y1={yPos}
                    y2={yPos}
                    stroke={alpha(theme.palette.text.secondary, 0.2)}
                    strokeWidth={1}
                  />
                );
              })}
              {xTicks.map((tick) => {
                const xPos =
                  durationSec > 0
                    ? MARGIN.left +
                      (tick / durationSec) * (CHART_WIDTH - MARGIN.left - MARGIN.right)
                    : MARGIN.left;
                return (
                  <line
                    key={`x-${generateId(32)}`}
                    x1={xPos}
                    x2={xPos}
                    y1={MARGIN.top}
                    y2={CHART_HEIGHT - MARGIN.bottom}
                    stroke={alpha(theme.palette.text.secondary, 0.2)}
                    strokeWidth={1}
                  />
                );
              })}
            </g>

            {chartPath ? (
              <g>
                <path
                  d={chartPath}
                  fill="none"
                  stroke="url(#feedChartLine)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill={theme.palette.text.secondary}
              >
                Waiting for feed data...
              </text>
            )}

            {/* Y-axis labels */}
            <g>
              {yTicks.map((tick) => {
                const yPos =
                  MARGIN.top +
                  (1 - (tick - yMin) / yRange) * (CHART_HEIGHT - MARGIN.top - MARGIN.bottom);
                return (
                  <text
                    key={`yt-${tick}`}
                    x={MARGIN.left - 6}
                    y={yPos}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill={theme.palette.text.secondary}
                  >
                    {`${Math.round(tick)}`}
                  </text>
                );
              })}
            </g>

            {/* X-axis labels */}
            <g>
              {xTicks.map((tick) => {
                const xPos =
                  durationSec > 0
                    ? MARGIN.left +
                      (tick / durationSec) * (CHART_WIDTH - MARGIN.left - MARGIN.right)
                    : MARGIN.left;
                return (
                  <text
                    key={`xt-${tick}`}
                    x={xPos}
                    y={CHART_HEIGHT - MARGIN.bottom + 18}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize="11"
                    fill={theme.palette.text.secondary}
                  >
                    {formatSeconds(tick)}
                  </text>
                );
              })}
            </g>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default FeedChart;
