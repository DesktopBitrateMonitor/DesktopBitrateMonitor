import React, { useCallback, useEffect, useMemo } from 'react';
import { useMessagesConfigStore } from '../../../contexts/DataContext';
import { Box, Stack, TextField, Typography } from '@mui/material';
import RoleFilterControls from '../../../components/functional/RoleFilterControls';
import RoleSortControls from '../../../components/functional/RoleSortControls';
import LayoutToggle from '../../../components/functional/LayoutToggle';
import MessagePanel from './panels/MessagePanel';
import { sortTwitchCommands } from '../../../../../scripts/lib/shared-functions';
import { useAlert } from '../../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';

const MessageSettings = () => {
  const ALLOWED_SORTS = ['none', 'enabled', 'disabled'];

  const { messagesConfig, updateMessagesConfig } = useMessagesConfigStore();

  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [layoutMode, setLayoutMode] = React.useState('grid');
  const [sortMode, setSortMode] = React.useState('none');
  const [filterMode, setFilterMode] = React.useState('all');
  const [displayOrder, setDisplayOrder] = React.useState([]);
  const [collapsedIds, setCollapsedIds] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  const messages = useMemo(() => {
    const list = Array.isArray(messagesConfig?.messages) ? messagesConfig.messages : [];
    const order = Array.isArray(displayOrder) && displayOrder.length ? displayOrder : null;
    if (!order) return list;

    const byId = new Map(list.map((msg) => [msg.id, msg]));
    const used = new Set();
    const ordered = [];
    order.forEach((id) => {
      const msg = byId.get(id);
      if (msg) {
        ordered.push(msg);
        used.add(id);
      }
    });
    list.forEach((msg) => {
      if (!used.has(msg.id)) ordered.push(msg);
    });
    return ordered;
  }, [messagesConfig?.messages, displayOrder]);

  useEffect(() => {
    const storedLayout = messagesConfig?.layout;
    if (storedLayout === 'grid' || storedLayout === 'list') {
      setLayoutMode(storedLayout);
    } else {
      setLayoutMode('grid');
    }

    const storedSort = messagesConfig?.sort;
    if (storedSort && ALLOWED_SORTS.includes(storedSort)) {
      setSortMode(storedSort);
    } else {
      setSortMode('none');
    }

    const savedOrder = Array.isArray(messagesConfig?.order) ? messagesConfig.order : [];
    const msgs = Array.isArray(messagesConfig?.messages) ? messagesConfig.messages : [];
    const mergedOrder = (() => {
      const byId = new Set();
      const next = [];
      savedOrder.forEach((id) => {
        if (msgs.some((m) => m.id === id)) {
          byId.add(id);
          next.push(id);
        }
      });
      msgs.forEach((msg) => {
        if (!byId.has(msg.id)) next.push(msg.id);
      });
      return next;
    })();
    setDisplayOrder(mergedOrder);

    const savedCollapsed = Array.isArray(messagesConfig?.collapsed) ? messagesConfig.collapsed : [];
    setCollapsedIds(savedCollapsed);

    const storedFilter = messagesConfig?.filter;
    if (storedFilter) setFilterMode(storedFilter);
  }, [messagesConfig]);

  const persistMessages = useCallback(
    async (nextMessages) => {
      updateMessagesConfig((prev) => {
        const base = prev && typeof prev === 'object' ? prev : {};
        return { ...base, messages: nextMessages };
      });
      const res = await window.storeApi.set('messages-config', 'messages', nextMessages);

      if (res.success) {
        showAlert({ message: 'Messages updated successfully', severity: 'success' });
      } else {
        showAlert({ message: 'Failed to update messages', severity: 'error' });
      }
    },
    [updateMessagesConfig]
  );

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateMessagesConfig((prev) => ({
        ...(prev || {}),
        layout: nextLayout
      }));

      await window.storeApi.set('messages-config', 'layout', nextLayout);
    },
    [updateMessagesConfig]
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

      updateMessagesConfig((prev) => ({
        ...(prev || {}),
        order: nextOrder
      }));

      await window.storeApi.set('messages-config', 'order', nextOrder);
    },
    [updateMessagesConfig]
  );

  const handleSortChange = useCallback(
    async (nextSort) => {
      if (!nextSort || !ALLOWED_SORTS.includes(nextSort)) return;
      setSortMode(nextSort);
      updateMessagesConfig((prev) => ({
        ...(prev || {}),
        sort: nextSort
      }));

      await window.storeApi.set('messages-config', 'sort', nextSort);

      const baseMessages = Array.isArray(messagesConfig?.messages) ? messagesConfig.messages : [];
      const sorted = sortTwitchCommands(baseMessages, nextSort);
      const nextOrder = sorted.map((c) => c.id);
      persistOrder(nextOrder);
    },
    [ALLOWED_SORTS, messagesConfig?.messages, persistOrder]
  );

  const persistFilter = useCallback(
    async (nextFilter) => {
      setFilterMode(nextFilter);
      updateMessagesConfig((prev) => ({
        ...(prev || {}),
        filter: nextFilter
      }));

      await window.storeApi.set('messages-config', 'filter', nextFilter);
    },
    [updateMessagesConfig]
  );

  const handleFilterChange = useCallback(
    (nextFilter) => {
      if (!nextFilter) return;
      persistFilter(nextFilter);
    },
    [persistFilter]
  );

  const toggleCollapsed = useCallback(
    async (messageId) => {
      const next = collapsedIds.includes(messageId)
        ? collapsedIds.filter((id) => id !== messageId)
        : [...collapsedIds, messageId];
      setCollapsedIds(next);

      updateMessagesConfig((prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('messages-config', 'collapsed', next);
    },
    [collapsedIds, updateMessagesConfig]
  );

  const handleMessageChange = useCallback(
    (nextMessage) => {
      persistMessages(messages.map((msg) => (msg.id === nextMessage.id ? nextMessage : msg)));
    },
    [messages, persistMessages]
  );

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return messages.filter((msg) => {
      const matchesFilter = (() => {
        if (filterMode === 'all') return true;
        if (filterMode === 'enabled') return Boolean(msg.enabled);
        if (filterMode === 'disabled') return !Boolean(msg.enabled);
        return true;
      })();

      const matchesSearch =
        !normalizedSearch ||
        (msg.label || '').toLowerCase().includes(normalizedSearch) ||
        (msg.message || '').toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [messages, filterMode, searchTerm]);

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
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Message Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Edit and manage the Twitch messages for the application.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            label={t('platforms.messages.searchBox.label')}
            placeholder={t('platforms.messages.searchBox.placeholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          />
          <RoleFilterControls
            value={filterMode}
            onChange={handleFilterChange}
            availableFilters={[0, 5, 6]}
          />
          <RoleSortControls
            value={sortMode}
            onChange={handleSortChange}
            availableSorts={[0, 5, 6]}
          />
          <LayoutToggle
            value={layoutMode}
            onChange={handleLayoutChange}
            availableFilters={[0, 1]}
          />
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
        {filteredMessages.map((message) => (
          <MessagePanel
            key={message.id}
            message={message}
            transLabel={`platforms.messages.${message.action}.${message.event}.label`}
            transHint={`platforms.messages.${message.action}.${message.event}.hint`}
            onChange={handleMessageChange}
            collapsible={layoutMode === 'list'}
            expanded={!collapsedIds.includes(message.id)}
            onExpandedChange={() => toggleCollapsed(message.id)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MessageSettings;
