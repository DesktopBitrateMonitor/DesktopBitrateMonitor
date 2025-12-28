import { Box, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import SaveIcon from '@mui/icons-material/Save';
import { useServerConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';

const OpenIrlElement = () => {
  const { serverConfig, updateServerConfig } = useServerConfigStore();
  const { showAlert } = useAlert();
  const type = 'openirl';

  const [serverData, setServerData] = useState({
    name: serverConfig[type].name,
    statsUrl: serverConfig[type].statsUrl,
    publisher: serverConfig[type].publisher
  });

  const [errorMessages, setErrorMessages] = useState({
    name: '',
    statsUrl: '',
    publisher: ''
  });

  const [dirtyStates, setDirtyStates] = useState({
    name: false,
    statsUrl: false,
    publisher: false
  });

  const [oldDataDraft, setOldDataDraft] = useState({
    name: serverConfig[type].name,
    statsUrl: serverConfig[type].statsUrl,
    publisher: serverConfig[type].publisher
  });

  const handleInputChange = (name, value) => {
    setServerData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (oldDataDraft[name] !== value) {
      setDirtyStates((prev) => ({
        ...prev,
        [name]: true
      }));
    } else {
      setDirtyStates((prev) => ({
        ...prev,
        [name]: false
      }));
    }

    const validationMessage = validateTextField(name, value);
    setErrorMessages((prev) => ({
      ...prev,
      [name]: validationMessage
    }));
  };

  const validateTextField = (name, value) => {
    if (name === 'statsUrl') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return 'Stats URL cannot be empty.';
      } else if (!value.startsWith('http://')) {
        return 'Stats URL must start with http.';
      } else if (value.includes(' ')) {
        return 'Stats URL must not contain spaces.';
      }
      return '';
    }
    if (name === 'publisher') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return 'Publisher cannot be empty.';
      } else if (value.includes(' ')) {
        return 'Publisher must not contain spaces.';
      }
    }
    if (name === 'name') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return 'Name cannot be empty.';
      }
      return '';
    }
    return '';
  };

  const saveField = async (name) => {
    if (errorMessages[name] !== '') return;
    if (oldDataDraft[name] === serverData[name]) return;

    const res = await window.storeApi.set('server-config', type, {
      ...serverConfig[type],
      [name]: serverData[name]
    });
    if (res.success) {
      updateServerConfig((prev) => ({
        ...(prev || {}),
        [type]: {
          ...(prev?.[type] || {}),
          [name]: serverData[name]
        }
      }));
      setOldDataDraft((prev) => ({
        ...prev,
        [name]: serverData[name]
      }));
      setDirtyStates((prev) => ({
        ...prev,
        [name]: false
      }));
      showAlert({ message: 'Data saved successfully', severity: 'success' });
    } else {
      showAlert({ message: 'Failed to save data', severity: 'error' });
    }
  };

  return (
    <Box>
      <Stack gap={2}>
        <TextField
          label="Server Name"
          value={serverData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveField('name');
            }
          }}
          sx={{ width: '240px' }}
          required
          error={Boolean(errorMessages.name)}
          helperText={errorMessages.name || 'The name of the server instance'}
          slotProps={{
            input: {
              endAdornment: dirtyStates.name && errorMessages.name.length === 0 && (
                <InputEndAdornment
                  title="Click or press Enter to save changes"
                  placement="top-start"
                  open={Boolean(dirtyStates.name)}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={(e) => saveField('name')}
                />
              )
            }
          }}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'column', xl: 'row' },
            gap: 2
          }}
        >
          <TextField
            fullWidth
            label="Stats URL"
            value={serverData.statsUrl || ''}
            onChange={(e) => handleInputChange('statsUrl', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveField('statsUrl');
              }
            }}
            required
            error={Boolean(errorMessages.statsUrl)}
            helperText={
              errorMessages.statsUrl ||
              'Example (legacy as option): http://<ip>:<port>/stats/play/live/<streamId>?legacy=1'
            }
            slotProps={{
              input: {
                endAdornment: dirtyStates.statsUrl && errorMessages.statsUrl.length === 0 && (
                  <InputEndAdornment
                    title="Click or press Enter to save changes"
                    placement="top-start"
                    open={Boolean(dirtyStates.statsUrl)}
                    color="success"
                    icon={<SaveIcon color="success" />}
                    handleClick={(e) => {
                      saveField('statsUrl');
                    }}
                  />
                )
              }
            }}
          />

          <TextField
            fullWidth
            label="Publisher"
            value={serverData.publisher || ''}
            onChange={(e) => handleInputChange('publisher', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveField('publisher');
              }
            }}
            required
            error={Boolean(errorMessages.publisher)}
            helperText={errorMessages.publisher || 'Example: live'}
            slotProps={{
              input: {
                endAdornment: dirtyStates.publisher && errorMessages.publisher.length === 0 && (
                  <InputEndAdornment
                    title="Click or press Enter to save changes"
                    placement="top-start"
                    open={Boolean(dirtyStates.publisher)}
                    color="success"
                    icon={<SaveIcon color="success" />}
                    handleClick={(e) => {
                      saveField('publisher');
                    }}
                  />
                )
              }
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default OpenIrlElement;
