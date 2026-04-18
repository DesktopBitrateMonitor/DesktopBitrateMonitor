import { alpha, Box, Typography } from '@mui/material';
import { memo } from 'react';
import { formatDuration } from '../lib/stats-calculator';
import { useTranslation } from 'react-i18next';

const OverallStats = memo(({ stats }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) =>
          alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.35 : 0.6)
      }}
    >
      <Typography variant="body2">{`${t('logging.historyWatcher.stats.uptime')}: ${formatDuration(stats.fullUptimeMs)}`}</Typography>
      {stats.sceneDurationEntries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('logging.historyWatcher.stats.noSceneData')}
        </Typography>
      ) : (
        stats.sceneDurationEntries.map((scene) => (
          <Typography key={scene.sceneKey} variant="body2">
            {`${scene.sceneName}: ${formatDuration(scene.duration)} (${t('logging.historyWatcher.stats.switches')}: ${scene.switchCount})`}
          </Typography>
        ))
      )}
    </Box>
  );
});

export default OverallStats;
