import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useStreamingSoftwareConfigStore } from '../../contexts/DataContext';
import ObsSettings from './components/ObsSettings.jsx';
import CollapsibleCard from '../../components/functional/CollapsibleCard.jsx';
import StreamlabsObsSettings from './components/StreamlabsObsSettings.jsx';
import MeldStudioSettings from './components/MeldStudioSettings.jsx';
import { useTranslation } from 'react-i18next';

const isDev = import.meta.env.DEV;

const SoftwareSettings = () => {
  const { t } = useTranslation();

  const SOFTWARES = [
    { label: t('software.select.options.obsStudio'), value: 'obs-studio', isDev: false },
    { label: t('software.select.options.streamlabsObs'), value: 'streamlabs-obs', isDev: true },
    { label: t('software.select.options.meldStudio'), value: 'meld-studio', isDev: true }
  ];

  const { streamingSoftwareConfig, updateStreamingSoftwareConfig } =
    useStreamingSoftwareConfigStore();

  const [softwareType, setSoftwareType] = React.useState(
    streamingSoftwareConfig?.currentType || 'obs-studio'
  );

  const handleSoftwareTypeChange = useCallback(
    async (nextType) => {
      setSoftwareType(nextType);
      updateStreamingSoftwareConfig((prev) => ({
        ...(prev || {}),
        currentType: nextType
      }));
      await window.storeApi.set('streaming-software-config', 'currentType', nextType);
    },
    [setSoftwareType, updateStreamingSoftwareConfig]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, p: 3 }}>
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
            {t('software.header')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('software.description')}
          </Typography>
        </Box>
        <FormControl>
          <InputLabel>{t('software.select.label')}</InputLabel>
          <Select
            id="software-type-label"
            label={t('software.select.label')}
            value={softwareType}
            sx={{ width: '200px' }}
            onChange={(e) => handleSoftwareTypeChange(e.target.value)}
          >
            {SOFTWARES.map((type) =>
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
          flex: '1 1 0',
          pt: 2,
          pb: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        {softwareType === 'obs-studio' && (
          <CollapsibleCard
            title={t('software.obsStudio.header')}
            subtitle={t('software.obsStudio.description')}
            collapsible={false}
            defaultExpanded={true}
          >
            <ObsSettings />
          </CollapsibleCard>
        )}
        {softwareType === 'streamlabs-obs' && (
          <CollapsibleCard
            title={t('software.streamlabsObs.header')}
            subtitle={t('software.streamlabsObs.description')}
            collapsible={false}
            defaultExpanded={true}
          >
            <StreamlabsObsSettings />
          </CollapsibleCard>
        )}
        {softwareType === 'meld-studio' && (
          <CollapsibleCard
            title={t('software.meldStudio.header')}
            subtitle={t('software.meldStudio.description')}
            collapsible={false}
            defaultExpanded={true}
          >
            <MeldStudioSettings />
          </CollapsibleCard>
        )}
      </Box>
    </Box>
  );
};

export default SoftwareSettings;
