import React from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { Box, IconButton, Switch, TextField, Tooltip, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';

const MessagePanel = ({ message, onChange, collapsible = true, expanded, onExpandedChange }) => {
  const [messageError, setMessageError] = React.useState('');
  const [messageDraft, setMessageDraft] = React.useState(message.message);
  const [oldMessageDraft, setOldMessageDraft] = React.useState(message.message);
  const [isDirty, setIsDirty] = React.useState(false);

  const handleEnabledChange = (event) => {
    onChange({ ...message, enabled: event.target.checked });
  };

  const handleMessageChange = (event) => {
    if (oldMessageDraft !== event.target.value) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }

    setMessageDraft(event.target.value);
  };

  const handleMessageSave = () => {
    if (!isDirty) return;
    const check = messageDraft.replace(/\s+/g, ' ').trim();
    if (check.length === 0) {
      setMessageError('Message cannot be empty');
      return;
    } else {
      setMessageError('');
    }
    onChange({ ...message, message: messageDraft });
    setOldMessageDraft(messageDraft);
    setIsDirty(false);
  };

  // render save action only when draft differs

  return (
    <CollapsibleCard
      title={message.label}
      subtitle={'Message are posted to the chat, if the event happens'}
      actions={
        <>
          <Typography variant="body2" color="text.secondary">
            {message.enabled ? 'Enabled' : 'Disabled'}
          </Typography>
          <Switch
            edge="end"
            checked={message.enabled}
            onChange={handleEnabledChange}
            inputProps={{ 'aria-label': `${message.label} enabled` }}
          />
        </>
      }
      defaultExpanded
      collapsible={collapsible}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <TextField
        fullWidth
        label={message.label}
        value={messageDraft}
        onChange={handleMessageChange}
        error={!!messageError}
        helperText={messageError}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleMessageSave();
          }
        }}
        InputProps={{
          endAdornment: isDirty && (
            <InputEndAdornment
              title="Click or press Enter to save changes"
              placement="top-start"
              open={Boolean(isDirty)}
              color="success"
              icon={<SaveIcon color="success" />}
              handleClick={handleMessageSave}
            />
          )
        }}
      />
    </CollapsibleCard>
  );
};

export default MessagePanel;
