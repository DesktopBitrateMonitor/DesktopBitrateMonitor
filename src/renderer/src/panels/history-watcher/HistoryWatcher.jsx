import { alpha, Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CollapsibleCard from '../../components/functional/CollapsibleCard';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HistoryRangeBrush from './components/HistoryRangeBrush';
import OverallStats from './components/OverallStats';
import { computeStats } from './lib/stats-calculator';

import { LineChart } from '@mui/x-charts';
import { useTranslation } from 'react-i18next';

const ChartSelectionOverlay = React.memo(({ theme, overlayRef }) => {
  return (
    <Box
      ref={overlayRef}
      sx={{
        display: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        backgroundColor: alpha(theme.palette.primary.main, 0.18),
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.8)}`
      }}
    />
  );
});

const HistoryWatcher = () => {
  const { t, i18n } = useTranslation();
  const locale = useMemo(() => {
    const lang = String(i18n?.resolvedLanguage || i18n?.language || '').toLowerCase();
    if (lang.startsWith('en')) return 'en-US';
    if (lang.startsWith('de')) return 'de-DE';
    return i18n?.resolvedLanguage || i18n?.language || undefined;
  }, [i18n?.language, i18n?.resolvedLanguage]);
  const theme = useTheme();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const location = useLocation();
  const logData = location.state?.logData || [];

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [zoomRange, setZoomRange] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const chartContainerRef = useRef(null);
  const chartSelectionOverlayRef = useRef(null);
  const chartSelectionRef = useRef({ active: false, x0: 0, x1: 0, pointerId: null });

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const chartHeight = Math.max(240, Math.floor(viewportHeight * 0.35));

  const getMinimumZoomWindow = () => {
    if (!fullRange) {
      return 1;
    }

    const [fullStart, fullEnd] = fullRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    return Math.max(1000, Math.floor(fullSpan * 0.01));
  };

  const logsWithTs = useMemo(() => {
    return logs
      .map((log) => ({
        ...log,
        _ts: new Date(log.ts).getTime()
      }))
      .filter((log) => Number.isFinite(log._ts))
      .sort((a, b) => a._ts - b._ts);
  }, [logs]);

  const fullRange = useMemo(() => {
    if (logsWithTs.length === 0) {
      return null;
    }

    const minTs = logsWithTs[0]._ts;
    const maxTs = logsWithTs[logsWithTs.length - 1]._ts;
    if (minTs === maxTs) {
      return [minTs, maxTs + 1];
    }

    return [minTs, maxTs];
  }, [logsWithTs]);

  const effectiveRange = zoomRange || fullRange;

  const visibleLogs = useMemo(() => {
    if (!effectiveRange) {
      return [];
    }

    const [startTs, endTs] = effectiveRange;
    return logsWithTs.filter((log) => log._ts >= startTs && log._ts <= endTs);
  }, [logsWithTs, effectiveRange]);

  const overallStats = useMemo(() => computeStats(logsWithTs), [logsWithTs]);

  useEffect(() => {
    if (logData.length > 0) {
      setLogs(logData);
      setZoomRange(null);
    }
    setSelectedLog(null);
  }, [logData]);

  useEffect(() => {
    if (!fullRange) {
      setZoomRange(null);
      return;
    }

    setZoomRange((prev) => {
      if (!prev) {
        return fullRange;
      }

      const [fullStart, fullEnd] = fullRange;
      const [prevStart, prevEnd] = prev;

      const clampedStart = Math.max(fullStart, Math.min(prevStart, fullEnd));
      const clampedEnd = Math.max(clampedStart + 1, Math.min(prevEnd, fullEnd));

      if (clampedStart === prevStart && clampedEnd === prevEnd) {
        return prev;
      }

      return [clampedStart, clampedEnd];
    });
  }, [fullRange]);

  const handleOpenHistoryLog = async () => {
    const res = await window.loggerApi.readSessionLogFile({
      title: t('logging.import.header'),
      filters: [{ name: t('logging.import.filters.name'), extensions: ['jsonl'] }],
      properties: ['openFile', 'multiSelections']
    });

    if (res.success && res?.data?.length > 0) {
      setLogs(res.data);
      setZoomRange(null);
      setSelectedLog(null);
    }
  };

  const clampRangeToFull = (candidateRange) => {
    if (!fullRange) {
      return candidateRange;
    }

    const [fullStart, fullEnd] = fullRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    const minWindow = getMinimumZoomWindow();

    let [startTs, endTs] = candidateRange;
    startTs = Math.max(fullStart, Math.min(startTs, fullEnd));
    endTs = Math.max(startTs + 1, Math.min(endTs, fullEnd));

    if (endTs - startTs < minWindow) {
      const center = (startTs + endTs) / 2;
      startTs = Math.max(fullStart, Math.floor(center - minWindow / 2));
      endTs = Math.min(fullEnd, startTs + minWindow);

      if (endTs - startTs < minWindow) {
        startTs = Math.max(fullStart, fullEnd - minWindow);
        endTs = fullEnd;
      }
    }

    return [startTs, endTs];
  };

  const handleChartWheel = (event) => {
    if (!event.shiftKey || !effectiveRange || !fullRange) {
      return;
    }

    event.preventDefault();

    const [fullStart, fullEnd] = fullRange;
    const [rangeStart, rangeEnd] = effectiveRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    const minWindow = getMinimumZoomWindow();
    const currentSpan = Math.max(minWindow, rangeEnd - rangeStart);
    const zoomFactor = Math.exp(Math.max(-4, Math.min(4, event.deltaY / 240)) * 0.2);
    const nextSpan = Math.max(minWindow, Math.min(fullSpan, Math.round(currentSpan * zoomFactor)));

    if (nextSpan >= fullSpan) {
      setZoomRange(fullRange);
      return;
    }

    const { x, width } = getRelativeChartX(event);
    const anchorRatio = width > 0 ? x / width : 0.5;
    const anchorTs = rangeStart + currentSpan * anchorRatio;

    let nextStart = anchorTs - nextSpan * anchorRatio;
    let nextEnd = nextStart + nextSpan;

    if (nextStart < fullStart) {
      nextStart = fullStart;
      nextEnd = fullStart + nextSpan;
    }

    if (nextEnd > fullEnd) {
      nextEnd = fullEnd;
      nextStart = fullEnd - nextSpan;
    }

    setZoomRange(clampRangeToFull([Math.floor(nextStart), Math.ceil(nextEnd)]));
  };

  useEffect(() => {
    const chartElement = chartContainerRef.current;
    if (!chartElement) {
      return undefined;
    }

    chartElement.addEventListener('wheel', handleChartWheel, { passive: false });

    return () => {
      chartElement.removeEventListener('wheel', handleChartWheel);
    };
  }, [handleChartWheel]);

  const handleResetZoom = () => {
    if (!fullRange) {
      return;
    }
    setZoomRange(fullRange);
  };

  const getRelativeChartX = (event) => {
    const chartEl = chartContainerRef.current;
    if (!chartEl) {
      return { x: 0, width: 1 };
    }

    const rect = chartEl.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    return { x: clampedX, width: Math.max(1, rect.width) };
  };

  const hideChartSelectionOverlay = () => {
    const overlayEl = chartSelectionOverlayRef.current;
    if (!overlayEl) {
      return;
    }

    overlayEl.style.display = 'none';
    overlayEl.style.left = '0px';
    overlayEl.style.width = '0px';
  };

  const updateChartSelectionOverlay = (x0, x1) => {
    const overlayEl = chartSelectionOverlayRef.current;
    if (!overlayEl) {
      return;
    }

    overlayEl.style.display = 'block';
    overlayEl.style.left = `${Math.min(x0, x1)}px`;
    overlayEl.style.width = `${Math.abs(x1 - x0)}px`;
  };

  const resetChartSelection = () => {
    chartSelectionRef.current = { active: false, x0: 0, x1: 0, pointerId: null };
    hideChartSelectionOverlay();
  };

  const handleChartPointerDown = (event) => {
    if (!effectiveRange || event.button !== 2) {
      return;
    }

    event.preventDefault();

    const { x } = getRelativeChartX(event);
    chartSelectionRef.current = { active: true, x0: x, x1: x, pointerId: event.pointerId };
    updateChartSelectionOverlay(x, x);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleChartPointerMove = (event) => {
    if (!chartSelectionRef.current.active) {
      return;
    }

    event.preventDefault();

    const { x } = getRelativeChartX(event);
    chartSelectionRef.current.x1 = x;
    updateChartSelectionOverlay(chartSelectionRef.current.x0, x);
  };

  const finalizeChartSelection = (event, shouldCommit = true) => {
    if (!chartSelectionRef.current.active || !effectiveRange) {
      return;
    }

    event.preventDefault();

    const { x, width } = getRelativeChartX(event);
    const { x0, pointerId } = chartSelectionRef.current;
    const x1 = x;

    if (shouldCommit) {
      const [rangeStart, rangeEnd] = effectiveRange;
      const rangeSpan = rangeEnd - rangeStart;
      const leftPx = Math.min(x0, x1);
      const rightPx = Math.max(x0, x1);

      if (Math.abs(rightPx - leftPx) >= 6 && width > 0) {
        const toTs = (relativeX) => Math.floor(rangeStart + (relativeX / width) * rangeSpan);
        setZoomRange(clampRangeToFull([toTs(leftPx), toTs(rightPx)]));
      }
    }

    if (pointerId !== null && event.currentTarget.hasPointerCapture?.(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }

    resetChartSelection();
  };

  const handleChartContextMenu = (event) => {
    event.preventDefault();
  };

  const handleAxisClick = (_event, axisData) => {
    const dataIndex = axisData?.dataIndex;
    const point = visibleLogs[dataIndex];

    if (!point) {
      return;
    }

    setSelectedLog(point);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 3 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={t('logging.historyWatcher.toolTip')} arrow placement="top">
                <IconButton onClick={() => handleOpenHistoryLog()} size="small">
                  <FileOpenOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset zoom" arrow placement="top">
                <span>
                  <IconButton onClick={handleResetZoom} size="small" disabled={!effectiveRange}>
                    <RestartAltIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          }
        >
          <HistoryRangeBrush
            theme={theme}
            fullRange={fullRange}
            effectiveRange={effectiveRange}
            onCommitRange={setZoomRange}
          />
          <Box
            ref={chartContainerRef}
            onPointerDown={handleChartPointerDown}
            onPointerMove={handleChartPointerMove}
            onPointerUp={(event) => finalizeChartSelection(event, true)}
            onPointerCancel={(event) => finalizeChartSelection(event, false)}
            onLostPointerCapture={resetChartSelection}
            onContextMenu={handleChartContextMenu}
            sx={{
              position: 'relative',
              width: '100%',
              userSelect: 'none',
              touchAction: 'none',
              cursor: isShiftPressed ? 'zoom-in' : 'default'
            }}
          >
            <LineChart
              height={chartHeight}
              skipAnimation
              series={[
                {
                  data: visibleLogs.map((log) => log.bitrate),
                  label: `${t('logging.historyWatcher.y-label')}`,
                  showMark: false
                }
              ]}
              onAxisClick={handleAxisClick}
              xAxis={[
                {
                  scaleType: 'time',
                  label: `🕐 ${t('logging.historyWatcher.x-label')}`,
                  data: visibleLogs.map((log) => new Date(log._ts)),
                  valueFormatter: (date) =>
                    new Intl.DateTimeFormat(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }).format(date)
                }
              ]}
              yAxis={[
                {
                  min: 0,
                  max:
                    visibleLogs.length > 0
                      ? Math.max(...visibleLogs.map((log) => log.bitrate ?? 0)) + 500
                      : undefined,
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
                  fill: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.24 : 0.18
                  )
                }
              }}
            />
            <ChartSelectionOverlay theme={theme} overlayRef={chartSelectionOverlayRef} />
          </Box>
          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 1.5,
              alignItems: 'start'
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) =>
                  alpha(
                    theme.palette.background.default,
                    theme.palette.mode === 'dark' ? 0.35 : 0.6
                  )
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
                    <Typography variant="body2">{`${t('logging.historyWatcher.dataPointBox.file')}: ${selectedLog.sourceFileName || '-'}`}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
            <OverallStats stats={overallStats} />
          </Box>
        </CollapsibleCard>
      </Box>
    </Box>
  );
};

export default HistoryWatcher;
