import React, { useCallback, useState } from 'react';
import CollapsibleCard from '../../../components/functional/CollapsibleCard';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

import { Box, Switch, TextField, Tooltip, Typography } from '@mui/material';
import InputEndAdornment from '../../../components/feedback/InputEndAdornment';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useSwitcherConfigStore,
  useStreamingSoftwareConfigStore
} from '../../../contexts/DataContext';
import { useTranslation } from 'react-i18next';

const Scenes = ({ collapsedIds, toggleCollapsed }) => {
  const { t } = useTranslation();
  const SCENE_KEYS = [
    { key: 'sceneLive', label: t('switcher.scenes.liveScene') },
    { key: 'sceneOffline', label: t('switcher.scenes.offlineScene') },
    { key: 'sceneLow', label: t('switcher.scenes.lowBitrateScene') },
    { key: 'scenePrivacy', label: t('switcher.scenes.privacyScene') },
    { key: 'sceneStart', label: t('switcher.scenes.startScene') }
  ];

  const { switcherConfig, updateSwitcherConfig } = useSwitcherConfigStore();
  const { streamingSoftwareConfig } = useStreamingSoftwareConfigStore();
  const { showAlert } = useAlert();

  const initialScenesData = {
    sceneLive: switcherConfig.sceneLive,
    sceneOffline: switcherConfig.sceneOffline,
    sceneLow: switcherConfig.sceneLow,
    scenePrivacy: switcherConfig.scenePrivacy,
    sceneStart: switcherConfig.sceneStart,
    sceneCollection: switcherConfig.sceneCollection
  };

  const [oldDataDraft, setOldDataDraft] = useState(initialScenesData);
  const [scenesData, setScenesData] = useState(initialScenesData);

  const [dirtyStates, setDirtyStates] = useState({
    sceneLive: false,
    sceneOffline: false,
    sceneLow: false,
    scenePrivacy: false,
    sceneStart: false,
    sceneCollection: false
  });
  const [errorMessages, setErrorMessages] = useState({
    sceneLive: '',
    sceneOffline: '',
    sceneLow: '',
    scenePrivacy: '',
    sceneStart: '',
    sceneCollection: ''
  });

  const validateTextField = (name, value) => {
    if (
      name === 'sceneLive' ||
      name === 'sceneOffline' ||
      name === 'sceneLow' ||
      name === 'scenePrivacy' ||
      name === 'sceneStart'
    ) {
      if (value.replace(/\s+/g, ' ').trim() === '') {
        return t('switcher.scenes.error1', {
          scene: SCENE_KEYS.find((scene) => scene.key === name)?.label || name
        });
      }
      if (
        name !== 'scenePrivacy' &&
        scenesData.scenePrivacy.toLowerCase() === value.toLowerCase()
      ) {
        return t('switcher.scenes.error2', {
          scene: SCENE_KEYS.find((scene) => scene.key === name)?.label || name
        });
      }
      if (
        name === 'scenePrivacy' &&
        SCENE_KEYS.find(
          (scene) =>
            scene.key !== 'scenePrivacy' &&
            scenesData[scene.key].toLowerCase() === value.toLowerCase()
        )
      ) {
        return t('switcher.scenes.error3', {
          scene: SCENE_KEYS.find((scene) => scene.key === name)?.label || name
        });
      }
      if (
        name === 'sceneStart' &&
        SCENE_KEYS.find(
          (scene) =>
            scene.key !== 'sceneStart' &&
            scenesData[scene.key].toLowerCase() === value.toLowerCase()
        )
      ) {
        return t('switcher.scenes.error4', {
          scene: SCENE_KEYS.find((scene) => scene.key === name)?.label || name
        });
      }
    }
    if (name === 'sceneCollection') {
      if (value.length > 0 && value.trim() === '') {
        return t('switcher.scenes.error1', {
          scene: t('switcher.scenes.sceneCollection.label')
        });
      }
    }
    return '';
  };

  const handleInputChange = (name, value) => {
    setScenesData((prev) => ({
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
    if (oldDataDraft[name] === scenesData[name]) return;

    const res = await window.storeApi.set('switcher-config', name, scenesData[name]);

    if (res.success) {
      updateSwitcherConfig((prev) => ({
        ...(prev || {}),
        [name]: scenesData[name]
      }));
      setOldDataDraft((prev) => ({
        ...prev,
        [name]: scenesData[name]
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
      title={t('switcher.scenes.header')}
      subtitle={t('switcher.scenes.description')}
      expanded={!collapsedIds.includes('scenes')}
      onExpandedChange={() => toggleCollapsed('scenes')}
    >
      {streamingSoftwareConfig?.currentType === 'obs-studio' && (
        <Box mb={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label={t('switcher.scenes.sceneCollection.label')}
            name="sceneCollection"
            value={scenesData.sceneCollection}
            onChange={(e) => handleInputChange('sceneCollection', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveField('sceneCollection');
              }
            }}
            error={Boolean(errorMessages['sceneCollection'])}
            helperText={errorMessages['sceneCollection']}
            slotProps={{
              input: {
                endAdornment:
                  dirtyStates['sceneCollection'] && !errorMessages['sceneCollection'] ? (
                    <InputEndAdornment
                      title={t('switcher.inputAdornment')}
                      placement="top-start"
                      open={Boolean(dirtyStates['sceneCollection'])}
                      color="success"
                      icon={<SaveIcon color="success" />}
                      handleClick={() => {
                        saveField('sceneCollection');
                      }}
                    />
                  ) : undefined
              }
            }}
          />
          <Tooltip title={t('switcher.scenes.sceneCollection.hint')} arrow placement="bottom">
            <HelpOutlineOutlinedIcon
              sx={{ ml: 1, color: 'text.secondary', alignSelf: 'flex-start' }}
            />
          </Tooltip>
        </Box>
      )}
      {Object.entries(scenesData).map(([key, value]) => {
        if (key === 'sceneCollection') return null; // Skip rendering sceneCollection field here
        return (
          <Box key={key} mb={2}>
            <TextField
              fullWidth
              label={SCENE_KEYS.find((scene) => scene.key === key)?.label || key}
              name={key}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveField(key);
                }
              }}
              error={Boolean(errorMessages[key])}
              helperText={errorMessages[key]}
              slotProps={{
                input: {
                  endAdornment:
                    dirtyStates[key] && !errorMessages[key] ? (
                      <InputEndAdornment
                        title={t('switcher.inputAdornment')}
                        placement="top-start"
                        open={Boolean(dirtyStates[key])}
                        color="success"
                        icon={<SaveIcon color="success" />}
                        handleClick={() => {
                          saveField(key);
                        }}
                      />
                    ) : undefined
                }
              }}
            />
          </Box>
        );
      })}
    </CollapsibleCard>
  );
};

export default Scenes;
