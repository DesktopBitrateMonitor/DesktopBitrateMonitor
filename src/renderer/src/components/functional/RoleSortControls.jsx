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
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ShieldMoonOutlinedIcon from '@mui/icons-material/ShieldMoonOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import { useTranslation } from 'react-i18next';

const RoleSortControls = ({
  value = 'none',
  onChange,
  label = 'Sort',
  availableSorts = [0, 1, 2, 3, 4, 5, 6]
}) => {
  const { t } = useTranslation();
  const SORT_OPTIONS = [
    { value: 'none', label: 'Default', icon: <SortOutlinedIcon fontSize="small" /> },
    {
      value: 'roleBroadcaster',
      label: t('platforms.sorting.broadcaster'),
      icon: <ShieldMoonOutlinedIcon fontSize="small" />
    },
    {
      value: 'roleAdmin',
      label: t('platforms.sorting.admin'),
      icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />
    },
    {
      value: 'roleMod',
      label: t('platforms.sorting.moderator'),
      icon: <GroupOutlinedIcon fontSize="small" />
    },
    {
      value: 'roleUser',
      label: t('platforms.sorting.user'),
      icon: <PersonOutlineIcon fontSize="small" />
    },
    {
      value: 'enabled',
      label: t('app.global.enabled'),
      icon: <ToggleOnOutlinedIcon fontSize="small" />
    },
    {
      value: 'disabled',
      label: t('app.global.disabled'),
      icon: <ToggleOffOutlinedIcon fontSize="small" />
    }
  ];

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
        aria-label="Sort"
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
        <SortOutlinedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ onMouseLeave: handleClose }}
      >
        <ListSubheader>{label || 'Sort'}</ListSubheader>
        <Divider variant="middle" sx={{ mb: 1 }} />
        {SORT_OPTIONS.map(
          (sort, index) =>
            availableSorts.includes(index) && (
              <MenuItem
                key={sort.value}
                selected={value === sort.value}
                onClick={() => handleSelect(sort.value)}
              >
                <ListItemIcon>{sort.icon}</ListItemIcon>
                <ListItemText>{sort.label}</ListItemText>
              </MenuItem>
            )
        )}
      </Menu>
    </Stack>
  );
};

export default RoleSortControls;
