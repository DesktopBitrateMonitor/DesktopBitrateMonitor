import React, { useCallback, useEffect, useState } from 'react';
import { useAppConfigStore } from '../../contexts/DataContext';
import { useAlert } from '../../contexts/AlertContext';
import CollapsibleCard from '../../components/functional/CollapsibleCard';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Stack, Switch, TextField, Typography } from '@mui/material';
import InputEndAdornment from '../../components/feedback/InputEndAdornment';
import NumericInput from '../../components/functional/NumericInput';
import LayoutToggle from '../../components/functional/LayoutToggle';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import { useTranslation } from 'react-i18next';

const LoggingSettings = () => {
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [layoutMode, setLayoutMode] = useState('grid');

  const [loggingData, setLoggingData] = useState({
    sessionLogsPath: appConfig?.paths?.sessionLogsPath,
    actionsLogsPath: appConfig?.paths?.actionsLogsPath,
    sessionLogsFileSize: appConfig?.paths?.sessionLogsFileSize,
    logActions: appConfig?.paths?.logActions,
    logSessions: appConfig?.paths?.logSessions
  });

  const [errorMessages, setErrorMessages] = useState({
    sessionLogsPath: '',
    actionsLogsPath: '',
    sessionLogsFileSize: ''
  });

  const [dirtyStates, setDirtyStates] = useState({
    sessionLogsPath: false,
    actionsLogsPath: false,
    sessionLogsFileSize: false
  });

  const [oldDataDraft, setOldDataDraft] = useState({
    sessionLogsPath: appConfig?.paths?.sessionLogsPath,
    actionsLogsPath: appConfig?.paths?.actionsLogsPath,
    sessionLogsFileSize: appConfig?.paths?.sessionLogsFileSize
  });

  useEffect(() => {
    const storedLayout = appConfig?.paths?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('grid');
    }
  }, [appConfig]);

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateAppConfig((prev) => ({
        ...(prev || {}),
        paths: {
          ...(prev?.paths || {}),
          layout: nextLayout
        }
      }));

      await window.storeApi.set('app-config', 'paths', {
        ...(appConfig?.paths || {}),
        layout: nextLayout
      });
    },
    [updateAppConfig]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      persistLayoutMode(nextLayout);
    },
    [layoutMode, persistLayoutMode]
  );

  const validateTextField = useCallback(
    (name, value) => {
      if (name === 'sessionLogsPath' || name === 'actionsLogsPath') {
        if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
          return t('logging.validation.pathEmpty');
        } else if (value.includes(' ')) {
          return t('logging.validation.pathNoSpaces');
        }
      }
      if (name === 'sessionLogsFileSize') {
        const fileSizeNumber = Number(value);
        if (isNaN(fileSizeNumber) || !Number.isInteger(fileSizeNumber)) {
          return t('logging.validation.fileSizeInteger');
        } else if (fileSizeNumber < 0 || fileSizeNumber > 10) {
          return t('logging.validation.fileSizeRange');
        } else if (value.length === 0) {
          return t('logging.validation.fileSizeEmpty');
        }
      }
      return '';
    },
    [t]
  );

  const handleInputChange = (name, value) => {
    setLoggingData((prev) => ({
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

  const saveField = async (name) => {
    if (errorMessages[name] !== '') return;
    if (oldDataDraft[name] === loggingData[name]) return;

    const res = await window.storeApi.set('app-config', 'paths', {
      ...appConfig['paths'],
      [name]: loggingData[name]
    });

    if (res.success) {
      updateAppConfig((prev) => ({
        ...(prev || {}),
        paths: {
          ...(prev?.['paths'] || {}),
          [name]: loggingData[name]
        }
      }));
      setOldDataDraft((prev) => ({
        ...prev,
        [name]: loggingData[name]
      }));
      setDirtyStates((prev) => ({
        ...prev,
        [name]: false
      }));
      showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
    } else {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
    }
  };

  const changeLoggingState = useCallback(
    async (name, value) => {
      if (loggingData[name] === value) return;
      const res = await window.storeApi.set('app-config', 'paths', {
        ...appConfig['paths'],
        [name]: value
      });
      if (res.success) {
        updateAppConfig((prev) => ({
          ...(prev || {}),
          paths: {
            ...(prev?.['paths'] || {}),
            [name]: value
          }
        }));
        setLoggingData((prev) => ({
          ...prev,
          [name]: value
        }));
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [appConfig, loggingData, showAlert, t, updateAppConfig]
  );

  const handleOpenFileDialog = async (name) => {
    const selectedLabel =
      name === 'actionsLogsPath' ? t('logging.actionsPathLabel') : t('logging.sessionPathLabel');
    const options = {
      title: t('logging.directoryDialogTitle', { label: selectedLabel }),
      defaultPath: loggingData[name] || undefined,
      properties: ['openDirectory', 'createDirectory']
    };
    const result = await window.loggerApi.openFileDialog(options);
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      setLoggingData((prev) => ({
        ...prev,
        [name]: selectedPath
      }));
      await window.storeApi.set('app-config', 'paths', {
        ...appConfig['paths'],
        [name]: selectedPath
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}>
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
            {t('logging.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('logging.subtitle')}
          </Typography>
        </Box>
        <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
      </Box>

      <Box
        sx={{
          flex: '1 1 0',
          pt: 2,
          px: 1.5,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns:
              layoutMode === 'list'
                ? { xs: '1fr' }
                : {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    xl: 'repeat(2, minmax(0, 1fr))'
                  }
          }}
        >
          <CollapsibleCard
            title={t('logging.sessionCardTitle')}
            subtitle={t('logging.sessionCardSubtitle')}
            collapsible={false}
            defaultExpanded={true}
            actions={
              <>
                <Typography variant="body2" color="text.secondary">
                  {loggingData.logSessions ? t('logging.enabled') : t('logging.disabled')}
                </Typography>
                <Switch
                  checked={loggingData.logSessions}
                  onChange={(e) => changeLoggingState('logSessions', e.target.checked)}
                />
              </>
            }
          >
            <Stack gap={3}>
              <TextField
                sx={{
                  '& .MuiInputBase-root': { cursor: 'pointer' },
                  '& .MuiInputBase-input': { cursor: 'pointer' }
                }}
                label={t('logging.sessionPathLabel')}
                name="sessionLogsPath"
                value={loggingData.sessionLogsPath}
                onClick={() => handleOpenFileDialog('sessionLogsPath')}
                error={Boolean(errorMessages.sessionLogsPath)}
                helperText={errorMessages.sessionLogsPath || ''}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <>
                        <AdsClickIcon sx={{ color: 'text.secondary' }} />
                      </>
                    )
                  }
                }}
              />

              <NumericInput
                sx={{ mb: 2 }}
                key={'sessionLogsFileSize'}
                label={t('logging.fileSizeLabel')}
                name={'sessionLogsFileSize'}
                value={loggingData.sessionLogsFileSize}
                min={0}
                onChange={(e) => handleInputChange('sessionLogsFileSize', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveField('sessionLogsFileSize');
                  }
                }}
                error={Boolean(errorMessages['sessionLogsFileSize'])}
                helperText={errorMessages['sessionLogsFileSize'] || ''}
                slotProps={{
                  endAdornment:
                    dirtyStates['sessionLogsFileSize'] && !errorMessages['sessionLogsFileSize'] ? (
                      <InputEndAdornment
                        title={t('logging.saveTooltip')}
                        placement="top-start"
                        open={Boolean(dirtyStates['sessionLogsFileSize'])}
                        color="success"
                        icon={<SaveIcon color="success" />}
                        handleClick={() => saveField('sessionLogsFileSize')}
                      />
                    ) : undefined
                }}
              />
            </Stack>
          </CollapsibleCard>

          <CollapsibleCard
            title={t('logging.actionsCardTitle')}
            subtitle={t('logging.actionsCardSubtitle')}
            collapsible={false}
            defaultExpanded={true}
            actions={
              <>
                <Typography variant="body2" color="text.secondary">
                  {loggingData.logActions ? t('logging.enabled') : t('logging.disabled')}
                </Typography>
                <Switch
                  checked={loggingData.logActions}
                  onChange={(e) => changeLoggingState('logActions', e.target.checked)}
                />
              </>
            }
          >
            <TextField
              sx={{
                '& .MuiInputBase-root': { cursor: 'pointer' },
                '& .MuiInputBase-input': { cursor: 'pointer' }
              }}
              fullWidth
              label={t('logging.actionsPathLabel')}
              name="actionsLogsPath"
              onClick={(e) => handleOpenFileDialog('actionsLogsPath')}
              value={loggingData.actionsLogsPath}
              error={Boolean(errorMessages.actionsLogsPath)}
              helperText={errorMessages.actionsLogsPath || ''}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <>
                      <AdsClickIcon sx={{ color: 'text.secondary' }} />
                    </>
                  )
                }
              }}
            />
          </CollapsibleCard>
        </Box>
      </Box>
    </Box>
  );
};

export default LoggingSettings;
