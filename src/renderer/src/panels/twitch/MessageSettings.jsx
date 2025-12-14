import React, { useCallback, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Box, Stack, Typography } from '@mui/material';
import RoleFilterControls from '../../components/functional/RoleFilterControls';
import RoleSortControls from '../../components/functional/RoleSortControls';
import LayoutToggle from '../../components/functional/LayoutToggle';
import MessagePanel from './components/MessagePanel';
import { sortTwitchCommands } from '../../../../scripts/lib/shared-functions';
import { useAlert } from '../../contexts/AlertContext';

const MessageSettings = () => {
  const ALLOWED_SORTS = ['none', 'enabled', 'disabled'];

  const {
    data: { messagesConfig },
    updateStoreLocally
  } = useData();

  const { showAlert } = useAlert();

  const [layoutMode, setLayoutMode] = React.useState('grid');
  const [sortMode, setSortMode] = React.useState('none');
  const [filterMode, setFilterMode] = React.useState('all');
  const [displayOrder, setDisplayOrder] = React.useState([]);
  const [collapsedIds, setCollapsedIds] = React.useState([]);

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
      updateStoreLocally('messagesConfig', (prev) => {
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
    [updateStoreLocally]
  );

  const persistLayoutMode = useCallback(
    async (nextLayout) => {
      setLayoutMode(nextLayout);

      updateStoreLocally('messagesConfig', (prev) => ({
        ...(prev || {}),
        layout: nextLayout
      }));

      await window.storeApi.set('messages-config', 'layout', nextLayout);
    },
    [updateStoreLocally]
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

      updateStoreLocally('messagesConfig', (prev) => ({
        ...(prev || {}),
        order: nextOrder
      }));

      await window.storeApi.set('messages-config', 'order', nextOrder);
    },
    [updateStoreLocally]
  );

  const handleSortChange = useCallback(
    async (nextSort) => {
      if (!nextSort || !ALLOWED_SORTS.includes(nextSort)) return;
      setSortMode(nextSort);
      updateStoreLocally('messagesConfig', (prev) => ({
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
      updateStoreLocally('messagesConfig', (prev) => ({
        ...(prev || {}),
        filter: nextFilter
      }));

      await window.storeApi.set('messages-config', 'filter', nextFilter);
    },
    [updateStoreLocally]
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

      updateStoreLocally('messagesConfig', (prev) => ({
        ...(prev || {}),
        collapsed: next
      }));

      await window.storeApi.set('messages-config', 'collapsed', next);
    },
    [collapsedIds, updateStoreLocally]
  );

  const handleMessageChange = useCallback(
    (nextMessage) => {
      persistMessages(messages.map((msg) => (msg.id === nextMessage.id ? nextMessage : msg)));
    },
    [messages, persistMessages]
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
            Message Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Edit and manage the Twitch messages for the application.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
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
        {messages
          .filter((msg) => {
            if (filterMode === 'all') return true;
            if (filterMode === 'enabled') return Boolean(msg.enabled);
            if (filterMode === 'disabled') return !Boolean(msg.enabled);
            return true;
          })
          .map((message) => (
            <MessagePanel
              key={message.id}
              message={message}
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
