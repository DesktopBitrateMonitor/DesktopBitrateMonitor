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
  title,
  subtitle,
  actions,
  defaultExpanded = true,
  collapsible = true,
  children
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 55%)'
            : theme.palette.background.paper,
        minHeight: 0
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title && (
              <Typography variant="subtitle1" noWrap={!subtitle}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {actions}
            {collapsible && (
              <IconButton
                size="small"
                edge="end"
                aria-label={expanded ? 'Collapse section' : 'Expand section'}
                onClick={() => setExpanded((prev) => !prev)}
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
