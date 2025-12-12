import React from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Reusable sort controls for role-based and enabled/title sorting.
 *
 * Props:
 * - value:
 *   'none' | 'roleAdmin' | 'roleMod' | 'roleUser' | 'enabled' | 'disabled' | 'titleAsc' | 'titleDesc'
 * - onChange(nextValue)
 * - label?: string
 */
const RoleSortControls = ({ value = 'none', onChange, label = 'Sort' }) => {
  const handleChange = (_event, next) => {
    if (!next) return;
    onChange?.(next);
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={handleChange}
        size="small"
        sx={{
          display: 'inline-flex',
          borderRadius: 2.5,
          overflow: 'hidden',
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.8 : 0.4),
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontSize: 12,
            px: 1.25,
            py: 0.4,
            border: 'none',
            borderRadius: 0,
            color: (theme) => theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08)
            },
            '&:not(:last-of-type)': {
              borderRight: (theme) => `1px solid ${theme.palette.divider}`
            }
          },
          '& .MuiToggleButton-root.Mui-selected': {
            color: (theme) => theme.palette.primary.main,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.26)
            }
          }
        }}
      >
        <ToggleButton value="none">Default</ToggleButton>
        <ToggleButton value="roleAdmin">Admin</ToggleButton>
        <ToggleButton value="roleMod">Mod</ToggleButton>
        <ToggleButton value="roleUser">User</ToggleButton>
        <ToggleButton value="enabled">Enabled</ToggleButton>
        <ToggleButton value="disabled">Disabled</ToggleButton>
        <ToggleButton value="titleAsc">Title Asc</ToggleButton>
        <ToggleButton value="titleDesc">Title Desc</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default RoleSortControls;
