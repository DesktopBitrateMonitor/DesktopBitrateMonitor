import React from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import { Switch, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import { useTranslation } from 'react-i18next';

const MessagePanel = ({
  message,
  onChange,
  collapsible = true,
  expanded,
  onExpandedChange,
  transLabel,
  transHint
}) => {
  const { t } = useTranslation();
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
      title={t(transLabel)}
      subtitle={t('platforms.messages.subtitle')}
      actions={
        <>
          <Typography variant="body2" color="text.secondary">
            {message.enabled ? 'Enabled' : 'Disabled'}
          </Typography>
          <Switch edge="end" checked={message.enabled} onChange={handleEnabledChange} />
        </>
      }
      defaultExpanded
      collapsible={collapsible}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <TextField
        fullWidth
        label={t(transLabel)}
        value={messageDraft}
        onChange={handleMessageChange}
        error={!!messageError}
        helperText={!messageError ? t(transHint) : messageError}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleMessageSave();
          }
        }}
        slotProps={{
          input: {
            endAdornment: isDirty && (
              <InputEndAdornment
                title={t('platforms.messages.save')}
                placement="top-start"
                open={Boolean(isDirty)}
                color="success"
                icon={<SaveIcon color="success" />}
                handleClick={handleMessageSave}
              />
            )
          }
        }}
      />
    </CollapsibleCard>
  );
};

export default MessagePanel;
