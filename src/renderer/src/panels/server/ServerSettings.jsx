import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useServerConfigStore } from '../../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import ServerElement from './components/ServerElement.jsx';
import AddIcon from '@mui/icons-material/Add';
import LayoutToggle from '../../components/functional/LayoutToggle.jsx';
import { useAlert } from '../../contexts/AlertContext.jsx';
import generateId from '../../../../scripts/lib/id-generator.js';

const isDev = import.meta.env.DEV;

const SortableServerElement = ({ instance, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: instance.id
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        transform: transform
          ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
          : undefined,
        transition,
        opacity: isDragging ? 0.92 : 1,
        zIndex: isDragging ? 2 : 1,
        touchAction: 'manipulation'
      }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners }, isDragging })}
    </Box>
  );
};

const ServerSettings = () => {
  const { t } = useTranslation();
  const { serverConfig, updateServerConfig } = useServerConfigStore();
  const { showAlert } = useAlert();

  const SERVER_TYPES = [
    { label: t('server.select.options.srt-live-server'), value: 'srt-live-server', isDev: false },
    { label: t('server.select.options.openirl'), value: 'openirl', isDev: false },
    { label: t('server.select.options.belabox'), value: 'belabox', isDev: false },
    { label: t('server.select.options.nginx-rtmp'), value: 'nginx-rtmp', isDev: false }
  ];
  const [layoutMode, setLayoutMode] = useState('grid');
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [newInstanceDialogOpen, setNewInstanceDialogOpen] = useState(false);
  const [newInstanceData, setNewInstanceData] = useState({
    serverType: SERVER_TYPES[0].value,
    name: '',
    statsUrl: '',
    publisher: ''
  });
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    statsUrl: '',
    publisher: ''
  });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  useEffect(() => {
    const storedLayout = serverConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('grid');
    }

    const savedCollapsed = Array.isArray(serverConfig?.collapsed) ? serverConfig.collapsed : [];
    setCollapsedIds(savedCollapsed);
  }, [serverConfig]);

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateServerConfig((prev) => ({
        ...(prev || {}),
        layout: nextLayout
      }));

      await window.storeApi.set('server-config', 'layout', nextLayout);
    },
    [updateServerConfig]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      persistLayoutMode(nextLayout);
    },
    [layoutMode, persistLayoutMode]
  );

  const toggleCollapsed = useCallback(
    async (instanceId) => {
      const next = collapsedIds.includes(instanceId)
        ? collapsedIds.filter((id) => id !== instanceId)
        : [...collapsedIds, instanceId];
      setCollapsedIds(next);

      updateServerConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('server-config', 'collapsed', next);
    },
    [collapsedIds, updateServerConfig]
  );

  const persistInstances = useCallback(
    async (nextInstances) => {
      updateServerConfig((prev) => {
        if (!prev) {
          return {
            serverInstances: nextInstances
          };
        }
        if (Array.isArray(prev)) {
          return nextInstances;
        }
        return {
          ...(prev || {}),
          serverInstances: nextInstances
        };
      });
      const res = await window.storeApi.set('server-config', 'serverInstances', nextInstances);

      if (res.success) {
        showAlert({
          message: t('alerts.saveSuccess'),
          severity: 'success'
        });

        await window.servicesApi.restartStatsFetcherService('server-stats-fetcher');
      } else {
        showAlert({
          message: t('alerts.saveError'),
          severity: 'error'
        });
      }
    },
    [showAlert, t, updateServerConfig]
  );

  const handleInstanceChange = useCallback(
    async (nextInstance) => {
      await persistInstances(
        serverConfig.serverInstances.map((inst) =>
          inst.id === nextInstance.id ? nextInstance : inst
        )
      );
    },
    [serverConfig, persistInstances]
  );

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

  const handleCreateInstance = async () => {
    updateServerConfig((prev) => {
      const nextInstances = [
        ...(prev.serverInstances || []),
        { ...newInstanceData, id: generateId(), enabled: false }
      ];
      return {
        ...prev,
        serverInstances: nextInstances
      };
    });

    const res = await window.storeApi.set('server-config', 'serverInstances', [
      ...(serverConfig.serverInstances || []),
      { ...newInstanceData, id: generateId(), enabled: false }
    ]);
    if (res.success) {
      showAlert({
        message: t('alerts.saveSuccess'),
        severity: 'success'
      });
      setNewInstanceData({
        serverType: SERVER_TYPES[0].value,
        name: '',
        statsUrl: '',
        publisher: ''
      });
      setNewInstanceDialogOpen(false);
    } else {
      showAlert({
        message: t('alerts.saveError'),
        severity: 'error'
      });
    }
  };

  const handleNewInstanceInputChange = (name, value) => {
    setNewInstanceData((prev) => ({
      ...prev,
      [name]: value
    }));

    const error = validateTextField(name, value);
    setErrorMessages((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleDeleteInstance = async (instanceId) => {
    const nextInstances = serverConfig.serverInstances.filter((inst) => inst.id !== instanceId);
    updateServerConfig((prev) => ({
      ...prev,
      serverInstances: nextInstances
    }));
    const res = await window.storeApi.set('server-config', 'serverInstances', nextInstances);
    if (res.success) {
      showAlert({
        message: t('alerts.deleteSuccess'),
        severity: 'success'
      });
      await window.servicesApi.restartStatsFetcherService('server-stats-fetcher');
    } else {
      showAlert({
        message: t('alerts.deleteError'),
        severity: 'error'
      });
    }
  };

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentInstances = serverConfig.serverInstances || [];
      const oldIndex = currentInstances.findIndex((inst) => inst.id === active.id);
      const newIndex = currentInstances.findIndex((inst) => inst.id === over.id);

      if (oldIndex < 0 || newIndex < 0) return;

      const nextInstances = arrayMove(currentInstances, oldIndex, newIndex);
      await persistInstances(nextInstances);
    },
    [persistInstances, serverConfig.serverInstances]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
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
            {t('server.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('server.description')}
          </Typography>
        </Box>

        <Stack direction={'row'} spacing={1.5} alignItems="center">
          <Button startIcon={<AddIcon />} onClick={() => setNewInstanceDialogOpen(true)}>
            {t('app.global.button.addInstance')}
          </Button>
          <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
        </Stack>
      </Box>
      {serverConfig.serverInstances.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
          {t('server.noInstances')}
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={(serverConfig.serverInstances || []).map((instance) => instance.id)}
            strategy={rectSortingStrategy}
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
                        xl: 'repeat(3, minmax(0, 1fr))'
                      }
              }}
            >
              {(serverConfig.serverInstances || []).map((instance, index) => (
                <SortableServerElement key={instance.id} instance={instance}>
                  {({ dragHandleProps, isDragging }) => (
                    <ServerElement
                      index={index}
                      instance={instance}
                      onChange={handleInstanceChange}
                      onDelete={handleDeleteInstance}
                      collapsible={layoutMode === 'list'}
                      expanded={!collapsedIds.includes(instance.id)}
                      onExpandedChange={() => toggleCollapsed(instance.id)}
                      serverTypes={SERVER_TYPES}
                      layout={layoutMode}
                      dragHandleProps={dragHandleProps}
                      isDragging={isDragging}
                    />
                  )}
                </SortableServerElement>
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}
      <Dialog
        fullWidth={true}
        maxWidth="md"
        open={newInstanceDialogOpen}
        onClose={() => setNewInstanceDialogOpen(false)}
      >
        <DialogTitle>Create a new Instance</DialogTitle>
        <DialogContent>
          <Box sx={{ padding: 1 }}>
            <Stack gap={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                  label={t(`server.${newInstanceData.serverType}.nameBox.label`)}
                  placeholder={t(`server.${newInstanceData.serverType}.nameBox.label`)}
                  value={newInstanceData.name || ''}
                  error={!!errorMessages.name}
                  helperText={
                    !errorMessages.name
                      ? t(`server.${newInstanceData.serverType}.nameBox.hint`)
                      : errorMessages.name
                  }
                  onChange={(e) => handleNewInstanceInputChange('name', e.target.value)}
                  sx={{ width: '240px' }}
                  required
                />
                <FormControl>
                  <InputLabel>{t('server.select.label')}</InputLabel>
                  <Select
                    id="server-type-label"
                    label={t('server.select.label')}
                    value={newInstanceData.serverType}
                    sx={{ width: '200px' }}
                    onChange={(e) =>
                      setNewInstanceData((prev) => ({ ...prev, serverType: e.target.value }))
                    }
                  >
                    {SERVER_TYPES.map((type) =>
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
                  flexDirection: { xs: 'column', sm: 'column', xl: 'row' },
                  gap: 2
                }}
              >
                <TextField
                  fullWidth
                  label={t(`server.${newInstanceData.serverType}.urlBox.label`)}
                  placeholder={t(`server.${newInstanceData.serverType}.urlBox.label`)}
                  value={newInstanceData.statsUrl || ''}
                  error={!!errorMessages.statsUrl}
                  onChange={(e) => handleNewInstanceInputChange('statsUrl', e.target.value)}
                  required
                  helperText={
                    !errorMessages.statsUrl
                      ? t(`server.${newInstanceData.serverType}.urlBox.hint`)
                      : errorMessages.statsUrl
                  }
                />

                <TextField
                  fullWidth
                  label={t(`server.${newInstanceData.serverType}.publisherBox.label`)}
                  placeholder={t(`server.${newInstanceData.serverType}.publisherBox.label`)}
                  value={newInstanceData.publisher || ''}
                  error={!!errorMessages.publisher}
                  onChange={(e) => handleNewInstanceInputChange('publisher', e.target.value)}
                  required
                  helperText={
                    !errorMessages.publisher
                      ? t(`server.${newInstanceData.serverType}.publisherBox.hint`)
                      : errorMessages.publisher
                  }
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={
              !!errorMessages.name ||
              !!errorMessages.statsUrl ||
              !!errorMessages.publisher ||
              newInstanceData.name === ''
            }
            onClick={handleCreateInstance}
            color="primary"
            variant="contained"
          >
            {t('app.global.button.save')}
          </Button>
          <Button onClick={() => setNewInstanceDialogOpen(false)} variant="outlined">
            {t('app.global.button.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerSettings;
