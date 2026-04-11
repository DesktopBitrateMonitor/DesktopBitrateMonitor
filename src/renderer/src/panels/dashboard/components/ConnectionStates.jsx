import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import { useConnectionStates } from '../../../contexts/ConnectionStatesContext.jsx';
import { useTranslation } from 'react-i18next';
import { useStreamStats } from '../../../contexts/StreamStatsContext.jsx';

const getToneColors = (theme, tone) => {
  switch (tone) {
    case 'success':
      return {
        dot: theme.palette.success.main,
        bg: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.12)
      };
    case 'warning':
      return {
        dot: theme.palette.warning.main,
        bg: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.16 : 0.12)
      };
    case 'error':
      return {
        dot: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.16 : 0.12)
      };
    default:
      return {
        dot: theme.palette.text.disabled,
        bg: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.04)
      };
  }
};

const getInstanceChipColors = (theme, stat, index) => {
  if (stat?.success) {
    if (index === 0) {
      return {
        border: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.54 : 0.42),
        text: theme.palette.text.primary,
        dot: theme.palette.secondary.main,
        bg: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.92 : 0.98)
      };
    }
    return {
      border: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.5 : 0.38),
      text: theme.palette.text.primary,
      dot: theme.palette.success.main,
      bg: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.92 : 0.98)
    };
  }

  return {
    border: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.52 : 0.4),
    text: theme.palette.text.primary,
    dot: theme.palette.error.main,
    bg: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.96)
  };
};

const ConnectionTile = ({
  icon = null,
  label,
  type,
  typeLabel,
  typeKey = 'server',
  status = 'unknown',
  isLive = false,
  stats = null
}) => {
  const { t } = useTranslation();

  const STATUS_META = {
    connected: { label: t('dashboard.connectionStates.states.connected'), tone: 'success' },
    connecting: { label: t('dashboard.connectionStates.states.connecting'), tone: 'warning' },
    asynchronous: { label: t('dashboard.connectionStates.states.asynchronous'), tone: 'warning' },
    disconnected: { label: t('dashboard.connectionStates.states.disconnected'), tone: 'error' },
    unknown: { label: t('dashboard.connectionStates.states.unknown'), tone: 'neutral' }
  };
  const BROADCAST_SOFTWARE_NAME_MAP = {
    'obs-studio': t('dashboard.connectionStates.softwareNames.obsStudio'),
    'streamlabs-obs': t('dashboard.connectionStates.softwareNames.streamlabsObs'),
    'meld-studio': t('dashboard.connectionStates.softwareNames.meldStudio')
  };

  const theme = useTheme();
  const meta = STATUS_META[status] ?? STATUS_META.unknown;
  const colors = getToneColors(theme, meta.tone);

  return (
    <Box
      role="group"
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        px: 1.25,
        py: 1,
        minHeight: 84,
        backgroundColor: colors.bg,
        transition: (t) =>
          t.transitions.create(['transform', 'background-color'], { duration: 150 }),
        '&:hover': {
          transform: 'translateY(-1px)',
          backgroundColor: alpha(colors.dot, theme.palette.mode === 'dark' ? 0.2 : 0.14)
        }
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '999px',
              backgroundColor: alpha(
                theme.palette.background.paper,
                theme.palette.mode === 'dark' ? 0.55 : 0.9
              ),
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.6 : 1)
            }}
          >
            {React.cloneElement(icon, { fontSize: 'small' })}
          </Box>
        )}
        <Box display={'flex'} flexDirection="column" gap={1}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }} noWrap>
            {label}
          </Typography>
          {typeKey !== 'server' && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, lineHeight: 1, color: 'text.secondary' }}
              noWrap
            >
              {typeLabel || (typeKey === 'software' ? BROADCAST_SOFTWARE_NAME_MAP[type] : null)}
            </Typography>
          )}
          {typeKey === 'server' && stats.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {stats.map((stat, index) => {
                const chipColors = getInstanceChipColors(theme, stat, index);

                return (
                  <Chip
                    key={stat.instance.id}
                    label={`${stat.instance.name} ${Number(stat?.data?.bitrate) || 0} kbps`}
                    size="small"
                    sx={{
                      height: 30,
                      borderRadius: '999px',
                      px: 0.45,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      color: chipColors.text,
                      border: '1px solid',
                      borderColor: chipColors.border,
                      backgroundColor: chipColors.bg,
                      backdropFilter: 'blur(10px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.08)}`
                        : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.7)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.08)}`,
                      '& .MuiChip-label': {
                        px: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        '&::before': {
                          content: '""',
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: chipColors.dot,
                          boxShadow: `0 0 0 2px ${alpha(chipColors.dot, theme.palette.mode === 'dark' ? 0.2 : 0.16)}`
                        }
                      }
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <></>
          )}
          {isLive ? (
            <Stack
              sx={{ position: 'absolute', top: 1, left: 5 }}
              direction={'row'}
              alignItems={'center'}
              spacing={1}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.background.paper, 0.85)}`
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'error.main',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      textShadow: `0 0 0 ${alpha(theme.palette.error.main, 0.7)}`
                    },
                    '70%': {
                      textShadow: `0 0 10px ${alpha(theme.palette.error.main, 0)}`
                    },
                    '100%': {
                      textShadow: `0 0 0 ${alpha(theme.palette.error.main, 0)}`
                    }
                  }
                }}
              >
                LIVE
              </Typography>
            </Stack>
          ) : null}
        </Box>
      </Stack>

      <Box
        sx={{
          position: 'absolute',
          top: 5,
          right: 5,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: colors.dot,
          boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.background.paper, 0.85)}`
        }}
      />
    </Box>
  );
};

const ConnectionStates = ({ isMenu = false }) => {
  const { t } = useTranslation();
  const { statuses, softwareType, broadcastState } = useConnectionStates();
  const { instancesStats } = useStreamStats();

  const [instancesConnections, setInstancesConnections] = React.useState('unknown');

  React.useEffect(() => {
    if (instancesStats.length === 0) {
      setInstancesConnections('unknown');
      return;
    }

    const instancesSuccess = instancesStats.every((stat) => stat.success);
    const instancesAllFailed = instancesStats.every((stat) => !stat.success);

    if (instancesAllFailed) {
      setInstancesConnections('unknown');
      return;
    }
    if (!instancesSuccess) {
      setInstancesConnections('asynchronous');
      return;
    }
    setInstancesConnections('connected');
  }, [instancesStats]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        width: '100%'
      }}
    >
      <ConnectionTile
        // icon={<StorageRoundedIcon />}
        stats={instancesStats}
        typeKey="server"
        label={t('dashboard.connectionStates.serverTileLabel')}
        status={instancesConnections}
      />
      <ConnectionTile
        icon={<DesktopWindowsRoundedIcon />}
        label={t('dashboard.connectionStates.softwareTileLabel')}
        typeKey="software"
        isLive={broadcastState}
        type={softwareType}
        status={statuses.software}
      />
    </Box>
  );
};

export default ConnectionStates;
