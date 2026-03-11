import { IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import NumericInput from '../../../components/functional/NumericInput';
import { useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useStreamingSoftwareConfigStore } from '../../../contexts/DataContext';
import { useAlert } from '../../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';

const ObsSettings = () => {
  const { t } = useTranslation();
  const { streamingSoftwareConfig, updateStreamingSoftwareConfig } =
    useStreamingSoftwareConfigStore();
  const { showAlert } = useAlert();
  const type = 'obs-studio';

  const [softwareData, setSoftwareData] = useState({
    host: streamingSoftwareConfig[type].host,
    port: streamingSoftwareConfig[type].port,
    password: streamingSoftwareConfig[type].password
  });
  const [errorMessages, setErrorMessages] = useState({
    host: '',
    port: '',
    password: ''
  });
  const [dirtyStates, setDirtyStates] = useState({
    host: false,
    port: false,
    password: false
  });
  const [oldDataDraft, setOldDataDraft] = useState({
    host: streamingSoftwareConfig[type].host,
    port: streamingSoftwareConfig[type].port,
    password: streamingSoftwareConfig[type].password
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setSoftwareData((prev) => ({
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
    if (name === 'host') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return t('software.error1');
      } else if (value.includes(' ')) {
        return t('software.error2');
      }
    }
    if (name === 'port') {
      const portNumber = Number(value);
      if (portNumber < 1000 || portNumber > 65535) {
        return t('software.error3');
      }
    }
    if (name === 'name') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return t('software.error4');
      }
    }
    if (name === 'password') {
      if (value.includes(' ')) {
        return t('software.error5');
      }
    }
    return '';
  };

  const saveField = async (name) => {
    if (errorMessages[name] !== '') return;
    if (oldDataDraft[name] === softwareData[name]) return;

    const res = await window.storeApi.set('streaming-software-config', type, {
      ...streamingSoftwareConfig[type],
      [name]: softwareData[name]
    });
    if (res.success) {
      updateStreamingSoftwareConfig((prev) => ({
        ...(prev || {}),
        [type]: {
          ...(prev?.[type] || {}),
          [name]: softwareData[name]
        }
      }));
      setOldDataDraft((prev) => ({
        ...prev,
        [name]: softwareData[name]
      }));
      setDirtyStates((prev) => ({
        ...prev,
        [name]: false
      }));
      showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
    } else {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
    }

    const reconnectRes = await window.servicesApi.reconnectBroadcastSoftware('obs-studio');
    console.log('reconnectRes', reconnectRes);
    if (reconnectRes.success) {
      showAlert({ message: t('software.reconnectSuccessMessage'), severity: 'info' });
    } else {
      showAlert({
        message: t('software.reconnectErrorMessage', { error: reconnectRes.error }),
        severity: 'error'
      });
    }
  };

  return (
    <Stack gap={2}>
      <TextField
        label={t('software.obsStudio.hostBox.label')}
        placeholder={t('software.obsStudio.hostBox.placeholder')}
        name="host"
        value={softwareData.host || ''}
        onChange={(e) => handleInputChange('host', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            saveField('host');
          }
        }}
        error={Boolean(errorMessages.host)}
        helperText={errorMessages.host || t('software.obsStudio.hostBox.hint')}
        slotProps={{
          input: {
            endAdornment:
              dirtyStates.host && !errorMessages.host ? (
                <InputEndAdornment
                  title={t('software.inputAdornment')}
                  placement="top-start"
                  open={Boolean(dirtyStates.host)}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={() => {
                    saveField('host');
                  }}
                />
              ) : undefined
          }
        }}
      />
      <NumericInput
        label={t('software.obsStudio.portBox.label')}
        placeholder={t('software.obsStudio.portBox.placeholder')}
        name="port"
        min={1000}
        max={65535}
        value={softwareData.port || ''}
        onChange={(e) => handleInputChange('port', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            saveField('port');
          }
        }}
        error={Boolean(errorMessages.port)}
        helperText={errorMessages.port || t('software.obsStudio.portBox.hint')}
        slotProps={{
          endAdornment:
            dirtyStates.port && !errorMessages.port ? (
              <InputEndAdornment
                title={t('software.inputAdornment')}
                placement="top-start"
                open={Boolean(dirtyStates.port)}
                color="success"
                icon={<SaveIcon color="success" />}
                handleClick={() => {
                  saveField('port');
                }}
              />
            ) : undefined
        }}
      />
      <TextField
        label={t('software.obsStudio.passwordBox.label')}
        placeholder={t('software.obsStudio.passwordBox.placeholder')}
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={softwareData.password || ''}
        error={Boolean(errorMessages.password)}
        helperText={errorMessages.password || t('software.obsStudio.passwordBox.hint')}
        onChange={(e) => handleInputChange('password', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            saveField('password');
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                {dirtyStates.password && !errorMessages.password && (
                  <InputEndAdornment
                    title={t('software.inputAdornment')}
                    placement="top-start"
                    open={Boolean(dirtyStates.password)}
                    color="success"
                    icon={<SaveIcon color="success" />}
                    handleClick={() => {
                      saveField('password');
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
