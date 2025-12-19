import { Box, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import SaveIcon from '@mui/icons-material/Save';

const BelaboxElement = ({
  data,
  onChange,
  saveStatsUrl,
  isDirty,
  errorMessage,
  setErrorMessage
}) => {
  useEffect(() => {
    const value = data.statsUrl || '';
    let nextMessage = '';

    if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
      nextMessage = 'Stats URL cannot be empty.';
    } else if (!value.startsWith('http')) {
      nextMessage = 'Stats URL must start with http.';
    } else if (value.includes(' ')) {
      nextMessage = 'Stats URL must not contain spaces.';
    }

    if (nextMessage !== errorMessage) {
      setErrorMessage(nextMessage);
    }
  }, [data.statsUrl, errorMessage, setErrorMessage]);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        SrtLiveServer Settings
      </Typography>

      <Stack gap={2}>
        <TextField
          label="Name"
          value={data.name || ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          sx={{ width: '240px' }}
          helperText="The name of the server instance"
        />

        <TextField
          fullWidth
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveStatsUrl(e.target.value || '');
            }
          }}
          value={data.statsUrl || ''}
          label="Stats URL"
          error={Boolean(errorMessage)}
          helperText={errorMessage || 'Example: http://<ip>:<port>/stats/<streamId>'}
          slotProps={{
            input: {
              endAdornment: isDirty && errorMessage.length === 0 && (
                <InputEndAdornment
                  title="Click or press Enter to save changes"
                  placement="top-start"
                  open={Boolean(isDirty)}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={(e) => saveStatsUrl(e.target.value || '')}
                />
              )
            }
          }}
        />
      </Stack>
    </Box>
  );
};

export default BelaboxElement;
