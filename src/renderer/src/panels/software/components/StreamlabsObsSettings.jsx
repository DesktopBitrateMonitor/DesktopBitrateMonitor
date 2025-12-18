import { Box, Stack, TextField, Typography } from '@mui/material';
import NumericInput from '../../../components/functional/NumericInput';
import React, { useCallback } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';

const StreamlabsObsSettings = ({ data, onChange, onSave }) => {
  const [dirty, setDirty] = React.useState({ host: false, port: false, password: false });
  const [errors, setErrors] = React.useState({ host: '', port: '', password: '' });

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
      setDirty((prev) => ({ ...prev, [name]: true }));
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
        }
      }
    },
    [data, onSave, validate]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Software Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize the broadcasting software settings.
          </Typography>
        </Box>
      </Box>
      <Stack gap={2}>
        <TextField
          label="OBS WebSocket Host"
          name="host"
          value={data.host || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          error={Boolean(errors.host)}
          helperText={errors.host || ''}
          InputProps={{
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
          InputProps={{
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
          }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={data.password || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment:
              dirty.password && !errors.password ? (
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
              ) : undefined
          }}
        />
      </Stack>
    </Box>
  );
};

export default StreamlabsObsSettings;
