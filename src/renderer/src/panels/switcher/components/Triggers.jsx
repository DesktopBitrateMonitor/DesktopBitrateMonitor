import React, { useCallback, useEffect, useState } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
import SaveIcon from '@mui/icons-material/Save';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import NumericInput from '../../../components/functional/NumericInput';
import { useSwitcherConfigStore } from '../../../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from '@mui/material';

const Triggers = ({ collapsedIds, toggleCollapsed }) => {
  const { t } = useTranslation();
  const FIELD_LABELS = {
    trigger: t('switcher.triggers.trigger.label'),
    rTrigger: t('switcher.triggers.rTrigger.label'),
    offTrigger: t('switcher.triggers.offlineTrigger.label'),
    triggerToLive: t('switcher.triggers.switchToLiveTimeout.label'),
    triggerToLow: t('switcher.triggers.switchToLowTimeout.label'),
    triggerToOffline: t('switcher.triggers.switchToOfflineTimeout.label')
  };
  const FIELD_HINTS = {
    trigger: t('switcher.triggers.trigger.hint'),
    rTrigger: t('switcher.triggers.rTrigger.hint'),
    offTrigger: t('switcher.triggers.offlineTrigger.hint'),
    triggerToLive: t('switcher.triggers.switchToLiveTimeout.hint'),
    triggerToLow: t('switcher.triggers.switchToLowTimeout.hint'),
    triggerToOffline: t('switcher.triggers.switchToOfflineTimeout.hint')
  };

  const TRIGGER_KEYS = Object.keys(FIELD_LABELS);

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
    const parsedValue = Number(value);
    const nextValues = {
      ...triggersData,
      [name]: value
    };
    const triggerValue = Number(nextValues.trigger);
    const rTriggerValue = Number(nextValues.rTrigger);
    const offTriggerValue = Number(nextValues.offTrigger);

    if (
      name === 'trigger' ||
      name === 'rTrigger' ||
      name === 'offTrigger' ||
      name === 'triggerToLive' ||
      name === 'triggerToLow' ||
      name === 'triggerToOffline'
    ) {
      if (value.length === 0) {
        return t('switcher.triggers.error1', { value: FIELD_LABELS[name] });
      }
      if (isNaN(parsedValue) || !Number.isInteger(parsedValue)) {
        return t('switcher.triggers.error2', { value: FIELD_LABELS[name] });
      }

      if (name === 'trigger') {
        if (triggerValue >= rTriggerValue) {
          return t('switcher.triggers.error3', { value: FIELD_LABELS[name] });
        }
        if (triggerValue <= offTriggerValue) {
          return t('switcher.triggers.error6', { value: FIELD_LABELS[name] });
        }
      }

      if (name === 'rTrigger') {
        if (rTriggerValue <= triggerValue) {
          return t('switcher.triggers.error4', { value: FIELD_LABELS[name] });
        }
        if (rTriggerValue <= offTriggerValue) {
          return t('switcher.triggers.error6', { value: FIELD_LABELS[name] });
        }
      }

      if (name === 'offTrigger') {
        if (offTriggerValue >= triggerValue || offTriggerValue >= rTriggerValue) {
          return t('switcher.triggers.error5', { value: FIELD_LABELS[name] });
        }
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
      showAlert({ message: t('alerts.saveSuccess'), severity: 'success' });
    } else {
      showAlert({ message: t('alerts.saveError'), severity: 'error' });
    }
  };

  return (
    <CollapsibleCard
      title={t('switcher.triggers.header')}
      subtitle={t('switcher.triggers.description')}
      expanded={!collapsedIds.includes('trigger')}
      onExpandedChange={() => toggleCollapsed('trigger')}
    >
      <Stack gap={2}>
        {TRIGGER_KEYS.map((key) => (
          <NumericInput
            sx={{ mb: 2 }}
            key={key}
            label={FIELD_LABELS[key]}
            placeholder={FIELD_LABELS[key]}
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
            helperText={errorMessages[key] || FIELD_HINTS[key]}
            slotProps={{
              endAdornment:
                dirtyStates[key] && !errorMessages[key] ? (
                  <InputEndAdornment
                    title={t('switcher.inputAdornment')}
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
      </Stack>
    </CollapsibleCard>
  );
};

export default Triggers;
