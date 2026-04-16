import { alpha, Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CollapsibleCard from '../../components/functional/CollapsibleCard';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { LineChart } from '@mui/x-charts';
import { useTranslation } from 'react-i18next';

const HistoryRangeBrush = React.memo(({ theme, fullRange, effectiveRange, onCommitRange }) => {
  const [previewRange, setPreviewRange] = useState(null);
  const [interaction, setInteraction] = useState({
    active: false,
    mode: null,
    startX: 0,
    trackWidth: 1,
    startRange: null
  });

  const trackRef = useRef(null);
  const previewFrameRef = useRef(null);
  const pendingPreviewRangeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewFrameRef.current !== null) {
        cancelAnimationFrame(previewFrameRef.current);
      }
    };
  }, []);

  const clearScheduledPreview = () => {
    if (previewFrameRef.current !== null) {
      cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }
    pendingPreviewRangeRef.current = null;
  };

  const schedulePreviewUpdate = (nextRange) => {
    pendingPreviewRangeRef.current = nextRange;

    if (previewFrameRef.current !== null) {
      return;
    }

    previewFrameRef.current = requestAnimationFrame(() => {
      previewFrameRef.current = null;
      setPreviewRange(pendingPreviewRangeRef.current);
    });
  };

  const clampRangeToFull = (candidateRange) => {
    if (!fullRange) {
      return candidateRange;
    }

    const [fullStart, fullEnd] = fullRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    const minWindow = Math.max(1000, Math.floor(fullSpan * 0.01));

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

  const clampMoveRangeToFull = (candidateRange) => {
    if (!fullRange) {
      return candidateRange;
    }

    const [fullStart, fullEnd] = fullRange;
    let [startTs, endTs] = candidateRange;
    const span = Math.max(1, endTs - startTs);

    if (startTs < fullStart) {
      startTs = fullStart;
      endTs = fullStart + span;
    }

    if (endTs > fullEnd) {
      endTs = fullEnd;
      startTs = fullEnd - span;
    }

    return [startTs, endTs];
  };

  const getRelativeX = (event) => {
    const trackEl = trackRef.current;
    if (!trackEl) {
      return { x: 0, width: 1 };
    }

    const rect = trackEl.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    return { x: clampedX, width: Math.max(1, rect.width) };
  };

  const getTsFromBrushX = (x, width) => {
    if (!fullRange) {
      return 0;
    }

    const [fullStart, fullEnd] = fullRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    return Math.floor(fullStart + (x / width) * fullSpan);
  };

  const getNextRange = (currentX, activeInteraction) => {
    if (!activeInteraction.startRange || !fullRange) {
      return null;
    }

    const currentTs = getTsFromBrushX(currentX, activeInteraction.trackWidth);
    const anchorTs = getTsFromBrushX(activeInteraction.startX, activeInteraction.trackWidth);

    if (activeInteraction.mode === 'move') {
      const [startTs, endTs] = activeInteraction.startRange;
      const deltaTs = currentTs - anchorTs;
      return clampMoveRangeToFull([startTs + deltaTs, endTs + deltaTs]);
    }

    if (activeInteraction.mode === 'resize-left') {
      return clampRangeToFull([currentTs, activeInteraction.startRange[1]]);
    }

    if (activeInteraction.mode === 'resize-right') {
      return clampRangeToFull([activeInteraction.startRange[0], currentTs]);
    }

    const nextStart = Math.min(anchorTs, currentTs);
    const nextEnd = Math.max(anchorTs, currentTs);
    return clampRangeToFull([nextStart, nextEnd]);
  };

  const resetInteraction = () => {
    clearScheduledPreview();
    setInteraction({ active: false, mode: null, startX: 0, trackWidth: 1, startRange: null });
    setPreviewRange(null);
  };

  const handlePointerDown = (event) => {
    if (!fullRange || !effectiveRange) {
      return;
    }

    event.preventDefault();

    const { x, width } = getRelativeX(event);
    const [rangeStart, rangeEnd] = effectiveRange;
    const brushRole = event.target?.closest?.('[data-brush-role]')?.dataset?.brushRole;

    let mode = 'create';
    if (brushRole === 'resize-left') {
      mode = 'resize-left';
    } else if (brushRole === 'resize-right') {
      mode = 'resize-right';
    } else if (brushRole === 'move') {
      mode = 'move';
    }

    const nextInteraction = {
      active: true,
      mode,
      startX: x,
      trackWidth: width,
      startRange: [rangeStart, rangeEnd]
    };

    setInteraction(nextInteraction);
    setPreviewRange([rangeStart, rangeEnd]);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!interaction.active || !interaction.startRange || !fullRange) {
      return;
    }

    event.preventDefault();

    const { x } = getRelativeX(event);
    const nextRange = getNextRange(x, interaction);
    if (nextRange) {
      schedulePreviewUpdate(nextRange);
    }
  };

  const finalizeInteraction = (event, shouldCommit = true) => {
    if (!interaction.active) {
      return;
    }

    event.preventDefault();

    const { x } = getRelativeX(event);
    const nextRange = shouldCommit ? getNextRange(x, interaction) : null;
    if (shouldCommit && nextRange) {
      onCommitRange(nextRange);
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetInteraction();
  };

  const displayRange = previewRange || effectiveRange;

  const selectionStyle = useMemo(() => {
    if (!fullRange || !displayRange) {
      return null;
    }

    const [fullStart, fullEnd] = fullRange;
    const [rangeStart, rangeEnd] = displayRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    const leftPct = ((rangeStart - fullStart) / fullSpan) * 100;
    const widthPct = Math.max(0.5, ((rangeEnd - rangeStart) / fullSpan) * 100);

    return {
      left: `${Math.max(0, Math.min(99.5, leftPct))}%`,
      width: `${Math.min(100, widthPct)}%`
    };
  }, [displayRange, fullRange]);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finalizeInteraction(event, true)}
        onPointerCancel={(event) => finalizeInteraction(event, false)}
        onLostPointerCapture={resetInteraction}
        sx={{
          position: 'relative',
          height: 44,
          borderRadius: 1,
          cursor: interaction.active ? 'grabbing' : 'crosshair',
          userSelect: 'none',
          touchAction: 'none',
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.2 : 0.08
          ),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: 2,
            transform: 'translateY(-50%)',
            backgroundColor: alpha(theme.palette.primary.main, 0.35)
          }}
        />

        {selectionStyle && (
          <Box
            data-brush-role="move"
            sx={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              ...selectionStyle,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.22),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.85)}`,
              cursor: interaction.active
                ? interaction.mode === 'move'
                  ? 'grabbing'
                  : 'crosshair'
                : 'grab'
            }}
          >
            <Box
              data-brush-role="resize-left"
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 10,
                backgroundColor: alpha(theme.palette.primary.main, 0.95),
                cursor: 'ew-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: '0.875rem', color: 'white' }} />
            </Box>
            <Box
              data-brush-role="move"
              sx={{
                position: 'absolute',
                left: 10,
                right: 10,
                top: 0,
                bottom: 0,
                cursor: interaction.active && interaction.mode === 'move' ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UnfoldMoreIcon
                sx={{ fontSize: '1rem', color: alpha(theme.palette.primary.main, 0.6) }}
              />
            </Box>
            <Box
              data-brush-role="resize-right"
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 10,
                backgroundColor: alpha(theme.palette.primary.main, 0.95),
                cursor: 'ew-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: '0.875rem', color: 'white' }} />
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          mt: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          color: 'text.secondary'
        }}
      >
        <Typography variant="caption">
          {effectiveRange ? new Date(effectiveRange[0]).toLocaleString() : '-'}
        </Typography>
        <Typography variant="caption">
          {effectiveRange ? new Date(effectiveRange[1]).toLocaleString() : '-'}
        </Typography>
      </Box>
    </Box>
  );
});

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
  const { t } = useTranslation();
  const theme = useTheme();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const location = useLocation();
  const logData = location.state?.logData || [];

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [zoomRange, setZoomRange] = useState(null);
  const chartContainerRef = useRef(null);
  const chartSelectionOverlayRef = useRef(null);
  const chartSelectionRef = useRef({ active: false, x0: 0, x1: 0, pointerId: null });

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartHeight = Math.max(240, Math.floor(viewportHeight * 0.35));

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

  useEffect(() => {
    setLogs(logData);
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
      setSelectedLog(null);
    }
  };

  const clampRangeToFull = (candidateRange) => {
    if (!fullRange) {
      return candidateRange;
    }

    const [fullStart, fullEnd] = fullRange;
    const fullSpan = Math.max(1, fullEnd - fullStart);
    const minWindow = Math.max(1000, Math.floor(fullSpan * 0.01));

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
            sx={{ position: 'relative', width: '100%', userSelect: 'none', touchAction: 'none' }}
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
                  data: visibleLogs.map((log) => new Date(log._ts))
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
                  <Typography variant="body2">{`File: ${selectedLog.sourceFileName || '-'}`}</Typography>
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
