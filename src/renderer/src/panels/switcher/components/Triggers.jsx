import React, { useCallback, useEffect, useState } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
import SaveIcon from '@mui/icons-material/Save';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import NumericInput from '../../../components/functional/NumericInput';
import { useSwitcherConfigStore } from '../../../contexts/DataContext';

const FIELD_LABELS = {
  trigger: 'Trigger to low (kbps)',
  rTrigger: 'Reverse Trigger to live (kbps)',
  offTrigger: 'Trigger to offline (kbps)',
  triggerToLive: 'Switch To Live Timeout (s)',
  triggerToLow: 'Switch To Low Timeout (s)',
  triggerToOffline: 'Switch To Offline Timeout (s)'
};

const TRIGGER_KEYS = Object.keys(FIELD_LABELS);

const Triggers = ({ collapsedIds, toggleCollapsed }) => {
  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const { showAlert } = useAlert();

  const initialTriggersData = {
    trigger: switcherConfig.trigger,
    rTrigger: switcherConfig.rTrigger,
    offTrigger: switcherConfig.offTrigger,
    triggerToLive: switcherConfig.triggerToLive,
    triggerToLow: switcherConfig.triggerToLow,
    triggerToOffline: switcherConfig.triggerToOffline
  };

  const [triggersData, setTriggersData] = useState(initialTriggersData);
  const [oldValueDraft, setOldValueDraft] = useState(initialTriggersData);

  const [dirtyStates, setDirtyStates] = useState({
    trigger: false,
    rTrigger: false,
    offTrigger: false,
    triggerToLive: false,
    triggerToLow: false,
    triggerToOffline: false
  });
  const [errorMessages, setErrorMessages] = useState({
    trigger: '',
    rTrigger: '',
    offTrigger: '',
    triggerToLive: '',
    triggerToLow: '',
    triggerToOffline: ''
  });

  const validateTriggerValues = (name, value) => {
    const triggerValue = Number(value);
    if (
      name === 'trigger' ||
      name === 'rTrigger' ||
      name === 'offTrigger' ||
      name === 'triggerToLive' ||
      name === 'triggerToLow' ||
      name === 'triggerToOffline'
    ) {
      if (value.length === 0 || isNaN(triggerValue) || !Number.isInteger(triggerValue)) {
        return `${FIELD_LABELS[name]} must be an integer.`;
      }
      if (name === 'trigger' && triggersData.rTrigger <= triggerValue) {
        return `${FIELD_LABELS[name]} must be lower than Reverse Trigger to live.`;
      }
      if (name === 'rTrigger' && triggerValue <= triggersData.trigger) {
        return `${FIELD_LABELS[name]} must be greater than Trigger to low.`;
      }
      if (
        (name === 'offTrigger' && triggersData.trigger <= triggerValue) ||
        triggersData.rTrigger <= triggerValue
      ) {
        return `${FIELD_LABELS[name]} must be lower than both Trigger to low and Reverse Trigger to live.`;
      }
    }
    return '';
  };

  const handleInputChange = (name, value) => {
    setTriggersData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (oldValueDraft[name] !== value) {
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

    const validationMessage = validateTriggerValues(name, value);
    setErrorMessages((prev) => ({
      ...prev,
      [name]: validationMessage
    }));
  };

  const saveField = async (name) => {
    if (errorMessages[name] !== '') return;
    if (oldValueDraft[name] === triggersData[name]) return;

    const res = await window.storeApi.set('switcher-config', name, triggersData[name]);
    if (res.success) {
      updateSwitcherConfig((prev) => ({
        ...(prev || {}),
        [name]: triggersData[name]
      }));
      setOldValueDraft((prev) => ({
        ...prev,
        [name]: triggersData[name]
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
    <CollapsibleCard
      title={'Triggers Settings'}
      subtitle={'Setup the trigger values for the switcher'}
      expanded={!collapsedIds.includes('trigger')}
      onExpandedChange={() => toggleCollapsed('trigger')}
    >
      {TRIGGER_KEYS.map((key) => (
        <NumericInput
          sx={{ mb: 2 }}
          key={key}
          label={FIELD_LABELS[key]}
          name={key}
          value={triggersData[key]}
          min={0}
          onChange={(e) => handleInputChange(key, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveField(key);
            }
          }}
          error={Boolean(errorMessages[key])}
          helperText={errorMessages[key] || ''}
          slotProps={{
            endAdornment:
              dirtyStates[key] && !errorMessages[key] ? (
                <InputEndAdornment
                  title="Click or press Enter to save changes"
                  placement="top-start"
                  open={Boolean(dirtyStates[key])}
                  color="success"
                  icon={<SaveIcon color="success" />}
                  handleClick={() => saveField(key)}
                />
              ) : undefined
          }}
        />
      ))}
    </CollapsibleCard>
  );
};

export default Triggers;
