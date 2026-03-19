import React, { act, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { useCommandsConfigStore } from '../../../contexts/DataContext';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import RoleSortControls from '../../../components/functional/RoleSortControls';
import RoleFilterControls from '../../../components/functional/RoleFilterControls';
import { sortTwitchCommands } from '../../../../../scripts/lib/shared-functions';
import CommandPanel from './panels/CommandPanel';
import { useAlert } from '../../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';
import TwitchIcon from '../../../assets/icons/TwitchIcon';
import KickIcon from '../../../assets/icons/KickIcon';
import { useLocation } from 'react-router-dom';

const CommandSettings = () => {
  const ALLOWED_SORTS = [
    'none',
    'roleBroadcaster',
    'roleAdmin',
    'roleMod',
    'roleUser',
    'enabled',
    'disabled'
  ];

  const { commandsConfig, updateCommandsConfig } = useCommandsConfigStore();
  const location = useLocation();

  // Determine platform from route to select appropriate icon
  const platformRout = location.pathname.split('/')[3] || '';
  let PlatformIcon;
  if (platformRout === 'twitch') PlatformIcon = TwitchIcon;
  if (platformRout === 'kick') PlatformIcon = KickIcon;

  const { showAlert } = useAlert();

  const { t } = useTranslation();

  const [layoutMode, setLayoutMode] = useState('grid');
  const [sortMode, setSortMode] = useState('none');
  const [filterMode, setFilterMode] = useState('all');
  const [displayOrder, setDisplayOrder] = useState([]);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const commands = useMemo(() => {
    const list = Array.isArray(commandsConfig?.commands) ? commandsConfig.commands : [];
    const order = Array.isArray(displayOrder) && displayOrder.length ? displayOrder : null;
    if (!order) return list;

    const byId = new Map(list.map((cmd) => [cmd.id, cmd]));
    const used = new Set();
    const ordered = [];
    order.forEach((id) => {
      const cmd = byId.get(id);
      if (cmd) {
        ordered.push(cmd);
        used.add(id);
      }
    });
    list.forEach((cmd) => {
      if (!used.has(cmd.id)) ordered.push(cmd);
    });
    return ordered;
  }, [commandsConfig?.commands, displayOrder]);

  useEffect(() => {
    const storedLayout = commandsConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('grid');
    }

    const storedSort = commandsConfig?.sort;
    if (storedSort && ALLOWED_SORTS.includes(storedSort)) {
      setSortMode(storedSort);
    } else {
      setSortMode('none');
    }

    const savedOrder = Array.isArray(commandsConfig?.order) ? commandsConfig.order : [];
    const cmds = Array.isArray(commandsConfig?.commands) ? commandsConfig.commands : [];
    const mergedOrder = (() => {
      const byId = new Set();
      const next = [];
      savedOrder.forEach((id) => {
        if (cmds.some((c) => c.id === id)) {
          byId.add(id);
          next.push(id);
        }
      });
      cmds.forEach((c) => {
        if (!byId.has(c.id)) next.push(c.id);
      });
      return next;
    })();
    setDisplayOrder(mergedOrder);

    const savedCollapsed = Array.isArray(commandsConfig?.collapsed) ? commandsConfig.collapsed : [];
    setCollapsedIds(savedCollapsed);

    const storedFilter = commandsConfig?.filter;
    if (storedFilter) setFilterMode(storedFilter);
  }, [commandsConfig]);

  const persistCommands = useCallback(
    async (nextCommands) => {
      updateCommandsConfig((prev) => {
        if (!prev) {
          return { commands: nextCommands };
        }
        if (Array.isArray(prev)) {
          return nextCommands;
        }
        return {
          ...prev,
          commands: nextCommands
        };
      });

      const res = await window.storeApi.set('commands-config', 'commands', nextCommands);

      if (res.success) {
        showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
      } else {
        showAlert({ message: t('alerts.saveError'), severity: 'error' });
      }
    },
    [updateCommandsConfig]
  );

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateCommandsConfig((prev) => ({
        ...(prev || {}),
        layout: nextLayout
      }));

      await window.storeApi.set('commands-config', 'layout', nextLayout);
    },
    [updateCommandsConfig]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      if (!nextLayout || nextLayout === layoutMode) return;
      persistLayoutMode(nextLayout);
    },
    [layoutMode, persistLayoutMode]
  );

  const persistOrder = useCallback(
    async (nextOrder) => {
      setDisplayOrder(nextOrder);

      updateCommandsConfig((prev) => ({
        ...(prev || {}),
        order: nextOrder
      }));

      await window.storeApi.set('commands-config', 'order', nextOrder);
    },
    [updateCommandsConfig]
  );

  const handleSortChange = useCallback(
    async (nextSort) => {
      if (!nextSort || !ALLOWED_SORTS.includes(nextSort)) return;
      setSortMode(nextSort);
      updateCommandsConfig((prev) => ({
        ...(prev || {}),
        sort: nextSort
      }));

      await window.storeApi.set('commands-config', 'sort', nextSort);

      const baseCommands = Array.isArray(commandsConfig?.commands) ? commandsConfig.commands : [];
      const sorted = sortTwitchCommands(baseCommands, nextSort);
      const nextOrder = sorted.map((c) => c.id);
      persistOrder(nextOrder);
    },
    [ALLOWED_SORTS, commandsConfig?.commands, persistOrder]
  );

  const persistFilter = useCallback(
    async (nextFilter) => {
      setFilterMode(nextFilter);
      updateCommandsConfig((prev) => ({
        ...(prev || {}),
        filter: nextFilter
      }));

      await window.storeApi.set('commands-config', 'filter', nextFilter);
    },
    [updateCommandsConfig]
  );

  const handleFilterChange = useCallback(
    (nextFilter) => {
      if (!nextFilter) return;
      persistFilter(nextFilter);
    },
    [persistFilter]
  );

  const toggleCollapsed = useCallback(
    async (commandId) => {
      const next = collapsedIds.includes(commandId)
        ? collapsedIds.filter((id) => id !== commandId)
        : [...collapsedIds, commandId];
      setCollapsedIds(next);

      updateCommandsConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('commands-config', 'collapsed', next);
    },
    [collapsedIds, updateCommandsConfig]
  );

  const handleCommandChange = useCallback(
    (nextCommand) => {
      persistCommands(
        commands.map((command) => (command.id === nextCommand.id ? nextCommand : command))
      );
    },
    [commands, persistCommands]
  );

  const filteredCommands = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return commands.filter((command) => {
      const matchesFilter = (() => {
        if (filterMode === 'all') return true;
        if (filterMode === 'enabled') return Boolean(command.enabled);
        if (filterMode === 'disabled') return !Boolean(command.enabled);
        return command.requiredRole === filterMode;
      })();

      const aliasList = Array.isArray(command.cmd) ? command.cmd : [];
      const matchesSearch =
        !normalizedSearch ||
        (command.label || '').toLowerCase().includes(normalizedSearch) ||
        aliasList.some((alias) => alias.toLowerCase().includes(normalizedSearch));

      return matchesFilter && matchesSearch;
    });
  }, [commands, filterMode, searchTerm]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Box>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            {<PlatformIcon />}
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {t('platforms.commands.header')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('platforms.commands.description')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            label={t('platforms.commands.searchBox.label')}
            placeholder={t('platforms.commands.searchBox.placeholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          />
          <RoleFilterControls value={filterMode} onChange={handleFilterChange} />
          <RoleSortControls value={sortMode} onChange={handleSortChange} />
          <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
        </Stack>
      </Box>
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
        {filteredCommands.map((command) => (
          <CommandPanel
            key={command.id}
            command={command}
            onChange={handleCommandChange}
            collapsible={layoutMode === 'list'}
            expanded={!collapsedIds.includes(command.id)}
            onExpandedChange={() => toggleCollapsed(command.id)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CommandSettings;
