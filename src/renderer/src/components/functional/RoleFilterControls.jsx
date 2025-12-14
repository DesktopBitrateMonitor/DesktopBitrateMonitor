import React, { useState } from 'react';
import {
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ShieldMoonOutlinedIcon from '@mui/icons-material/ShieldMoonOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', icon: <FilterListOutlinedIcon fontSize="small" /> },
  { value: 'broadcaster', label: 'Broadcaster', icon: <ShieldMoonOutlinedIcon fontSize="small" /> },
  { value: 'admin', label: 'Admin', icon: <AdminPanelSettingsOutlinedIcon fontSize="small" /> },
  { value: 'mod', label: 'Mod', icon: <GroupOutlinedIcon fontSize="small" /> },
  { value: 'user', label: 'User', icon: <PersonOutlineIcon fontSize="small" /> },
  { value: 'enabled', label: 'Enabled', icon: <ToggleOnOutlinedIcon fontSize="small" /> },
  { value: 'disabled', label: 'Disabled', icon: <ToggleOffOutlinedIcon fontSize="small" /> }
];

// value: 'all' | 'broadcaster' | 'admin' | 'mod' | 'user' | 'enabled' | 'disabled'
const RoleFilterControls = ({
  value = 'all',
  onChange,
  label = 'Filter',
  availableFilters = [0, 1, 2, 3, 4, 5, 6]
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (next) => {
    handleClose();
    if (!next) return;
    onChange?.(next);
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconButton
        aria-label="Filter"
        onClick={handleOpen}
        size="small"
        sx={{
          color: (theme) => theme.palette.text.secondary,
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          borderRadius: 2,
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.8 : 0.4),
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08)
          }
        }}
      >
        <FilterListOutlinedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        PaperProps={{ onMouseLeave: handleClose }}
      >
        <ListSubheader>{label}</ListSubheader>
        <Divider variant="middle" sx={{ mb: 1 }} />
        {FILTER_OPTIONS.map(
          (filter, index) =>
            availableFilters.includes(index) && (
              <MenuItem
                key={filter.value}
                selected={value === filter.value}
                onClick={() => handleSelect(filter.value)}
              >
                <ListItemIcon>{filter.icon}</ListItemIcon>
                <ListItemText>{filter.label}</ListItemText>
              </MenuItem>
            )
        )}
      </Menu>
    </Stack>
  );
};

export default RoleFilterControls;
