import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Tooltip,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

/**
 * NumericInput component
 * A controlled number-only text field with inline increment/decrement round IconButtons.
 *
 * Props:
 *  - value (number|string)
 *  - onChange (eventLike) -> called with synthetic event { target: { value: number|string } }
 *  - min (number)
 *  - max (number)
 *  - step (number) default 1
 *  - allowEmpty (boolean) allow blank value mid-edit (default true)
 *  - clampOnBlur (boolean) clamp to range on blur (default true)
 *  - label / name / disabled / size / fullWidth ... forwarded to TextField
 */

const NumericInput = React.forwardRef(function NumericInput(props, ref) {
  const {
    value,
    onChange,
    min,
    max,
    step = 1,
    allowEmpty = true,
    clampOnBlur = true,
    label,
    name,
    disabled,
    size,
    fullWidth = true,
    InputProps: InputPropsProp,
    tooltip = false,
    tooltipIncrement = 'Increase',
    tooltipDecrement = 'Decrease',
    ...rest
  } = props;

  // enforce minimum step of 0.01
  const effectiveStep = Math.max(Number(step) || 0, 0.01);

  const toNumberOrEmpty = (val) => {
    if (val === '' && allowEmpty) return '';
    const raw = typeof val === 'string' ? val.trim().replace(',', '.') : val;
    const num = Number(raw);
    if (Number.isNaN(num)) return '';
    // round to 2 decimals when using fractional step
    if (effectiveStep < 1) return Math.round(num * 100) / 100;
    return num;
  };

  const emitChange = (nextVal) => {
    if (!onChange) return;
    onChange({ target: { value: nextVal, name } });
  };

  const sanitized = (raw) => {
    if (raw === '' && allowEmpty) return '';
    let s = String(raw).trim();
    // If fractional steps allowed, accept comma or dot as decimal separator
    if (effectiveStep < 1) {
      s = s.replace(/,/g, '.');
      // keep only digits, one dot and optional leading minus
      s = s.replace(/[^0-9.\-]/g, '');
      // collapse multiple dots into first dot
      const parts = s.split('.');
      if (parts.length > 2) s = parts.shift() + '.' + parts.join('');
      const num = Number(s);
      if (Number.isNaN(num)) return allowEmpty ? '' : 0;
      // round to two decimals
      return Math.round(num * 100) / 100;
    }
    // integer-only: strip non-digits
    const digits = s.replace(/[^0-9\-]/g, '');
    return digits === '' && allowEmpty ? '' : Number(digits);
  };

  const clamp = (num) => {
    if (num === '' || num === null || Number.isNaN(num))
      return allowEmpty ? '' : min ?? 0;
    let v = num;
    if (typeof min === 'number' && v < min) v = min;
    if (typeof max === 'number' && v > max) v = max;
    return v;
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow the user to type partial numbers (like "12.", "0,5") when fractional steps are allowed.
    if (effectiveStep < 1) {
      if (raw === '' && allowEmpty) {
        emitChange('');
        return;
      }
      // normalize comma to dot so the user sees '.' when typing ','
      let s = String(raw).replace(/,/g, '.');
      // keep only digits, dot and leading minus
      s = s.replace(/[^0-9.\-]/g, '');
      // collapse multiple dots: keep only the first dot
      const sepIndex = s.indexOf('.');
      if (sepIndex !== -1) {
        const before = s.slice(0, sepIndex + 1);
        const after = s.slice(sepIndex + 1).replace(/\./g, '');
        s = before + after;
      }
      emitChange(s);
      return;
    }

    // Integer mode: sanitize to digits (keeping optional leading minus)
    const next = sanitized(raw);
    emitChange(next);
  };

  const handleBlur = () => {
    if (!clampOnBlur) return;
    const num = toNumberOrEmpty(value);
    const clamped = clamp(num);
    if (clamped !== num) emitChange(clamped);
  };

  const stepper = (dir) => {
    const current = toNumberOrEmpty(value);
    let base = current === '' ? (typeof min === 'number' ? min : 0) : current;
    // use effectiveStep and round to 2 decimals when fractional
    let next = base + dir * effectiveStep;
    if (effectiveStep < 1) {
      next = Math.round(next * 100) / 100;
    }
    if (typeof min === 'number' && next < min) next = min;
    if (typeof max === 'number' && next > max) next = max;
    emitChange(next);
  };

  const endAdornment = (
    <InputAdornment position="end" sx={{ alignItems: 'center', ml: 0.5 }}>
      <Box display="flex" flexDirection="column" gap={0.5}>
        {tooltip ? (
          <>
            <Tooltip title={tooltipIncrement} placement="left" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    stepper(1);
                  }}
                  disabled={
                    disabled ||
                    (typeof max === 'number' && Number(value) >= max)
                  }
                  sx={{ p: 0.5 }}
                >
                  <KeyboardArrowUpIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={tooltipDecrement} placement="left" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    stepper(-1);
                  }}
                  disabled={
                    disabled ||
                    (typeof min === 'number' && Number(value) <= min)
                  }
                  sx={{ p: 0.5 }}
                >
                  <KeyboardArrowDownIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ) : (
          <>
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  stepper(1);
                }}
                disabled={
                  disabled || (typeof max === 'number' && Number(value) >= max)
                }
                sx={{ p: 0.5 }}
              >
                <KeyboardArrowUpIcon fontSize="inherit" />
              </IconButton>
            </span>
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  stepper(-1);
                }}
                disabled={
                  disabled || (typeof min === 'number' && Number(value) <= min)
                }
                sx={{ p: 0.5 }}
              >
                <KeyboardArrowDownIcon fontSize="inherit" />
              </IconButton>
            </span>
          </>
        )}
      </Box>
    </InputAdornment>
  );

  const mergedInputProps = {
    inputMode: effectiveStep < 1 ? 'decimal' : 'numeric',
    pattern: effectiveStep < 1 ? '[0-9]*[.,]?[0-9]*' : '[0-9]*',
    ...InputPropsProp,
    endAdornment: (
      <>
        {InputPropsProp?.endAdornment}
        {endAdornment}
      </>
    ),
  };

  return (
    <TextField
      ref={ref}
      label={label}
      name={name}
      value={value === undefined || value === null ? '' : value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      fullWidth={fullWidth}
      disabled={disabled}
      size={size}
      InputProps={mergedInputProps}
      type="text" // prevent native spinner
      {...rest}
    />
  );
});

export default NumericInput;