import React, { useEffect, useState } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import {
  alpha,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';

const isDev = import.meta.env.DEV;

const ServerElement = ({
  index,
  instance,
  collapsible = true,
  onChange,
  onDelete,
  expanded,
  onExpandedChange,
  serverTypes,
  layout,
  dragHandleProps,
  isDragging = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [serverData, setServerData] = useState({
    id: instance.id,
    serverType: instance.serverType,
    name: instance.name,
    statsUrl: instance.statsUrl,
    publisher: instance.publisher,
    enabled: instance.enabled
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
    id: instance.id,
    serverType: instance.serverType,
    name: instance.name,
    statsUrl: instance.statsUrl,
    publisher: instance.publisher,
    enabled: instance.enabled
  });

  useEffect(() => {
    setServerData({
      id: instance.id,
      serverType: instance.serverType,
      name: instance.name,
      statsUrl: instance.statsUrl,
      publisher: instance.publisher,
      enabled: instance.enabled
    });
    setOldDataDraft({
      id: instance.id,
      serverType: instance.serverType,
      name: instance.name,
      statsUrl: instance.statsUrl,
      publisher: instance.publisher,
      enabled: instance.enabled
    });
    setDirtyStates({
      name: false,
      statsUrl: false,
      publisher: false
    });
    setErrorMessages({
      name: '',
      statsUrl: '',
      publisher: ''
    });
  }, [instance]);

  const handleEnabledChange = (event) => {
    const nextData = { ...serverData, enabled: event.target.checked };
    setServerData(nextData);
    setOldDataDraft((prev) => ({ ...prev, enabled: event.target.checked }));
    onChange(nextData);
  };

  const handleInputChange = (name, value) => {
    const error = validateTextField(name, value);
    setErrorMessages((prev) => ({ ...prev, [name]: error }));
    setDirtyStates((prev) => ({ ...prev, [name]: value !== oldDataDraft[name] }));
    setServerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputSave = (name) => {
    if (errorMessages[name] !== '') return;
    if (oldDataDraft[name] === serverData[name]) return;

    onChange(serverData);
    setOldDataDraft((prev) => ({
      ...prev,
      [name]: serverData[name]
    }));
    setDirtyStates((prev) => ({
      ...prev,
      [name]: false
    }));
  };

  const handleServerTypeChange = (nextType) => {
    if (nextType === serverData.serverType) return;

    const nextData = {
      ...serverData,
      serverType: nextType
    };

    setServerData(nextData);
    setOldDataDraft((prev) => ({
      ...prev,
      serverType: nextType
    }));
    onChange(nextData);
  };

  const validateTextField = (name, value) => {
    if (name === 'statsUrl') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return t('server.error1');
      } else if (!value.startsWith('http://')) {
        return t('server.error2');
      } else if (value.includes(' ')) {
        return t('server.error3');
      }
      return '';
    }
    if (name === 'publisher') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return t('server.error4');
      } else if (value.includes(' ')) {
        return t('server.error5');
      }
    }
    if (name === 'name') {
      if (!value.trim() || value.replace(/\s+/g, '').length === 0) {
        return t('server.error6');
      }
      return '';
    }
    return '';
  };

  const handleDelete = () => {
    onDelete(serverData.id);
  };

  const chipStyles = {
    height: 28,
    borderRadius: '999px',
    px: 0.35,
    fontWeight: 700,
    letterSpacing: '0.01em',
    color: theme.palette.text.primary,
    border: '1px solid',
    borderColor: theme.palette.secondary.main,
    background: alpha(theme.palette.secondary.main, 0.15),
    backdropFilter: 'blur(10px)',
    boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.06 : 0.65)}`,
    '& .MuiChip-label': {
      px: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 0.75
    }
  };

  return (
    <CollapsibleCard
      startIcon={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            role="button"
            aria-label={t('app.global.button.drag')}
            {...dragHandleProps}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              color: 'text.secondary',
              touchAction: 'none'
            }}
          >
            <DragIndicatorIcon color="inherit" />
          </Box>
          {index === 0 && layout === 'grid' && (
            <Chip
              sx={chipStyles}
              label={t('server.primaryInstance')}
              size="small"
              color="primary"
            />
          )}
        </Box>
      }
      title={layout !== 'grid' ? serverData.name : null}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {serverData.enabled ? t('app.global.enabled') : t('app.global.disabled')}
          </Typography>
          <Switch checked={serverData.enabled} onChange={(e) => handleEnabledChange(e)} />
        </Stack>
      }
      centerElement={
        index === 0 &&
        layout === 'list' && (
          <Chip sx={chipStyles} label={t('server.primaryInstance')} size="small" color="primary" />
        )
      }
      defaultExpanded
      collapsible={collapsible}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <Box>
        <Stack gap={2}>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 2, sm: 2, md: 2 },
              flexDirection: {
                xs: 'column-reverse',
                sm: 'column-reverse',
                md: 'column-reverse',
                lg: 'row'
              },
              justifyContent: 'space-between'
            }}
          >
            <TextField
              label={t(`server.${serverData.serverType}.nameBox.label`)}
              placeholder={t(`server.${serverData.serverType}.nameBox.label`)}
              value={serverData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputSave('name');
                }
              }}
              sx={{ width: { xs: '100%', sm: '200px' } }}
              required
              error={!!errorMessages.name}
              helperText={
                !errorMessages.name
                  ? t(`server.${serverData.serverType}.nameBox.hint`)
                  : errorMessages.name
              }
              slotProps={{
                input: {
                  endAdornment: dirtyStates.name && errorMessages.name.length === 0 && (
                    <InputEndAdornment
                      title={t('server.inputAdornment')}
                      placement="top-start"
                      open={Boolean(dirtyStates.name)}
                      color="success"
                      icon={<SaveIcon color="success" />}
                      handleClick={() => {
                        handleInputSave('name');
                      }}
                    />
                  )
                }
              }}
            />
            <FormControl>
              <InputLabel>{t('server.select.label')}</InputLabel>
              <Select
                id="server-type-label"
                label={t('server.select.label')}
                value={serverData.serverType}
                sx={{ width: { xs: '100%', sm: '200px' } }}
                onChange={(e) => handleServerTypeChange(e.target.value)}
              >
                {serverTypes.map((type) =>
                  type.isDev && !isDev ? null : (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <TextField
              fullWidth
              label={t(`server.${serverData.serverType}.urlBox.label`)}
              placeholder={t(`server.${serverData.serverType}.urlBox.label`)}
              value={serverData.statsUrl || ''}
              onChange={(e) => handleInputChange('statsUrl', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputSave('statsUrl');
                }
              }}
              required
              error={!!errorMessages.statsUrl}
              helperText={
                !errorMessages.statsUrl
                  ? t(`server.${serverData.serverType}.urlBox.hint`)
                  : errorMessages.statsUrl
              }
              slotProps={{
                input: {
                  endAdornment: dirtyStates.statsUrl && errorMessages.statsUrl.length === 0 && (
                    <InputEndAdornment
                      title={t('server.inputAdornment')}
                      placement="top-start"
                      open={Boolean(dirtyStates.statsUrl)}
                      color="success"
                      icon={<SaveIcon color="success" />}
                      handleClick={() => {
                        handleInputSave('statsUrl');
                      }}
                    />
                  )
                }
              }}
            />

            <TextField
              fullWidth
              label={t(`server.${serverData.serverType}.publisherBox.label`)}
              placeholder={t(`server.${serverData.serverType}.publisherBox.label`)}
              value={serverData.publisher || ''}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputSave('publisher');
                }
              }}
              required
              error={!!errorMessages.publisher}
              helperText={
                !errorMessages.publisher
                  ? t(`server.${serverData.serverType}.publisherBox.hint`)
                  : errorMessages.publisher
              }
              slotProps={{
                input: {
                  endAdornment: dirtyStates.publisher && errorMessages.publisher.length === 0 && (
                    <InputEndAdornment
                      title={t('server.inputAdornment')}
                      placement="top-start"
                      open={Boolean(dirtyStates.publisher)}
                      color="success"
                      icon={<SaveIcon color="success" />}
                      handleClick={() => {
                        handleInputSave('publisher');
                      }}
                    />
                  )
                }
              }}
            />
          </Box>
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
            {t('app.global.button.remove')}
          </Button>
        </Box>
      </Box>
    </CollapsibleCard>
  );
};

export default ServerElement;
