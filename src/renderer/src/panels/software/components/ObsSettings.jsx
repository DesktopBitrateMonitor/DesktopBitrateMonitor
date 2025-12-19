import { IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import NumericInput from '../../../components/functional/NumericInput';
import React, { useCallback } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const ObsSettings = ({ data, onChange, onSave }) => {
  const [dirty, setDirty] = React.useState({ host: false, port: false, password: false });
  const [errors, setErrors] = React.useState({ host: '', port: '', password: '' });
  const [oldValueDraft, setOldValueDraft] = React.useState(data);
  const [showPassword, setShowPassword] = React.useState(false);

  const validate = useCallback((next) => {
    const nextErrors = { host: '', port: '', password: '' };

    if (!next.host || !next.host.trim()) {
      nextErrors.host = 'Host is required.';
    }

    if (!next.port) {
      nextErrors.port = 'Port is required.';
    } else if (Number.isNaN(Number(next.port))) {
      nextErrors.port = 'Port must be a number.';
    }

    // Password: optional here, adjust if you want rules

    setErrors(nextErrors);
    return nextErrors;
  }, []);

  const handleInputChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      const next = { ...data, [name]: value };
      onChange(next);

      if (oldValueDraft[name] !== value) {
        setDirty((prev) => ({ ...prev, [name]: true }));
      } else {
        setDirty((prev) => ({ ...prev, [name]: false }));
      }
      validate(next);
    },
    [data, onChange, validate]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const current = data;
        const currentErrors = validate(current);
        const hasError = Object.values(currentErrors).some(Boolean);
        if (!hasError) {
          onSave(current);
          setDirty({ host: false, port: false, password: false });
          setOldValueDraft(current);
        }
      }
    },
    [data, onSave, validate]
  );

  return (
    <Stack gap={2}>
      <TextField
        label="OBS WebSocket Host"
        name="host"
        value={data.host || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        error={Boolean(errors.host)}
        helperText={errors.host || ''}
        slotProps={{
          input: {
            endAdornment:
              dirty.host && !errors.host ? (
                <InputEndAdornment
                  title="Click or press Enter to save changes"
                  placement="top-start"
                  open={Boolean(dirty.host)}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={() => {
                    const currentErrors = validate(data);
                    const hasError = Object.values(currentErrors).some(Boolean);
                    if (!hasError) {
                      onSave(data);
                      setDirty((prev) => ({ ...prev, host: false }));
                    }
                  }}
                />
              ) : undefined
          }
        }}
      />
      <NumericInput
        label="Port"
        name="port"
        value={data.port || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        error={Boolean(errors.port)}
        helperText={errors.port || ''}
        slotProps={{
          input: {
            endAdornment:
              dirty.port && !errors.port ? (
                <InputEndAdornment
                  title="Click or press Enter to save changes"
                  placement="top-start"
                  open={Boolean(dirty.port)}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={() => {
                    const currentErrors = validate(data);
                    const hasError = Object.values(currentErrors).some(Boolean);
                    if (!hasError) {
                      onSave(data);
                      setDirty((prev) => ({ ...prev, port: false }));
                    }
                  }}
                />
              ) : undefined
          }
        }}
      />
      <TextField
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={data.password || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                {dirty.password && !errors.password && (
                  <InputEndAdornment
                    title="Click or press Enter to save changes"
                    placement="top-start"
                    open={Boolean(dirty.password)}
                    color="success"
                    icon={<SaveIcon color="success" />}
                    handleClick={() => {
                      const currentErrors = validate(data);
                      const hasError = Object.values(currentErrors).some(Boolean);
                      if (!hasError) {
                        onSave(data);
                        setDirty((prev) => ({ ...prev, password: false }));
                      }
                    }}
                  />
                )}
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ color: 'text.secondary' }} />
                  ) : (
                    <Visibility sx={{ color: 'text.secondary' }} />
                  )}
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />
    </Stack>
  );
};

export default ObsSettings;
