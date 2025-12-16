import { Box, IconButton, Tooltip } from '@mui/material';
import React from 'react';

const InputEndAdornment = ({
  title = 'Custom tooltip title',
  placement = 'top-start',
  handleClick,
  open,
  color = 'primary',
  icon
}) => {
  return (
    <Tooltip
      title={title}
      placement={placement}
      open={open}
      disableFocusListener
      disableHoverListener
      disableTouchListener
      slotProps={{
        tooltip: {
          sx: (theme) => ({
            bgcolor: theme.palette[color].main,
            color: theme.palette[color].contrastText,
            fontSize: 12,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            boxShadow: theme.shadows[4],
            letterSpacing: 0.3
          })
        },
        arrow: {
          sx: (theme) => ({
            color: theme.palette[color].main
          })
        }
      }}
      arrow
    >
      <Box>
        <IconButton onClick={handleClick}>{icon}</IconButton>
      </Box>
    </Tooltip>
  );
};

export default InputEndAdornment;
