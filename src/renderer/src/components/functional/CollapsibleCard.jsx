import React, { useState } from 'react';
import { Box, Collapse, Divider, IconButton, Paper, Stack, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Generic, reusable collapsible card shell.
 *
 * Props:
 * - title: string | ReactNode (main title)
 * - subtitle?: string | ReactNode (supporting text under title)
 * - actions?: ReactNode (right-aligned header actions)
 * - defaultExpanded?: boolean (initial expanded state)
 * - collapsible?: boolean (show collapse toggle and allow collapsing)
 * - children: ReactNode (body content)
 */
const CollapsibleCard = ({
  startIcon,
  centerElement,
  title,
  subtitle,
  actions,
  defaultExpanded = true,
  collapsible = true,
  expanded: controlledExpanded,
  onExpandedChange,
  sx,
  children
}) => {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const isControlled = typeof controlledExpanded === 'boolean';
  const expanded = isControlled ? controlledExpanded : expandedState;

  const toggle = () => {
    onExpandedChange?.(!expanded);
    if (!isControlled) {
      setExpandedState((prev) => !prev);
    }
  };

  return (
    <Paper
      sx={[
        {
          p: 2,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 55%)'
              : theme.palette.background.paper,
          minHeight: 0
        },
        sx
      ]}
    >
      <Stack spacing={2}>
        <Stack
          direction={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
          spacing={2}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: startIcon ? 'row' : 'column',
              alignItems: startIcon ? 'center' : 'flex-start'
            }}
          >
            {startIcon && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{startIcon}</Box>
            )}
            {title && (
              <Typography variant="subtitle1" noWrap={!subtitle}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: '80%' }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {centerElement && <Box sx={{ flex: 1 }}>{centerElement}</Box>}

          <Stack direction="row" spacing={1} alignItems="center">
            {actions}
            {collapsible && (
              <IconButton
                size="small"
                edge="end"
                aria-label={expanded ? 'Collapse section' : 'Expand section'}
                onClick={toggle}
              >
                {expanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            )}
          </Stack>
        </Stack>

        <Divider flexItem />

        {collapsible ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {children}
          </Collapse>
        ) : (
          children
        )}
      </Stack>
    </Paper>
  );
};

export default CollapsibleCard;
