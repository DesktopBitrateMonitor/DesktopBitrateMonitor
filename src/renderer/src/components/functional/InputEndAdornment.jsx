import { InputAdornment, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import React from 'react';

const InputEndAdornment = ({ tooltipTitle, align = 'bottom' }) => ({
  input: {
    endAdornment: (
      <InputAdornment position="end">
        <Tooltip title={tooltipTitle} placement={align} arrow>
          <HelpOutlineIcon sx={{ cursor: 'pointer' }} />
        </Tooltip>
      </InputAdornment>
    )
  }
});

export default InputEndAdornment;
