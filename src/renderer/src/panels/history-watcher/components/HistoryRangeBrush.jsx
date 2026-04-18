import { alpha, Box } from '@mui/material';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

const HistoryRangeBrush = memo(({ theme, fullRange, effectiveRange, onCommitRange }) => {
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


    </Box>
  );
});

export default HistoryRangeBrush;
