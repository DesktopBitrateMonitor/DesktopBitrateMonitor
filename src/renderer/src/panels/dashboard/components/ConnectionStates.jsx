import React from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import { useConnectionStates } from '../../../contexts/ConnectionStatesContext.jsx';
import { useTranslation } from 'react-i18next';

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

const ConnectionTile = ({
  icon,
  label,
  type,
  typeKey = 'server',
  status = 'unknown',
  isLive = false,
  speed = null,
  bitrate = null
}) => {
  const { t } = useTranslation();

  const STATUS_META = {
    connected: { label: t('dashboard.connectionStates.states.connected'), tone: 'success' },
    connecting: { label: t('dashboard.connectionStates.states.connecting'), tone: 'warning' },
    asynchronous: { label: t('dashboard.connectionStates.states.asynchronous'), tone: 'warning' },
    disconnected: { label: t('dashboard.connectionStates.states.disconnected'), tone: 'error' },
    unknown: { label: t('dashboard.connectionStates.states.unknown'), tone: 'neutral' }
  };

  const SERVER_NAME_MAP = {
    openirl: t('dashboard.connectionStates.serverNames.openIrl'),
    'srt-live-server': t('dashboard.connectionStates.serverNames.srtLiveServer'),
    belabox: t('dashboard.connectionStates.serverNames.belabox'),
    'nginx-rtmp': t('dashboard.connectionStates.serverNames.nginxRtmp')
  };

  const BROADCAST_SOFTWARE_NAME_MAP = {
    'obs-studio': t('dashboard.connectionStates.softwareNames.obsStudio'),
    'streamlabs-obs': t('dashboard.connectionStates.softwareNames.streamlabsObs'),
    'meld-studio': t('dashboard.connectionStates.softwareNames.meldStudio')
  };

  const theme = useTheme();
  const meta = STATUS_META[status];
  const colors = getToneColors(theme, meta.tone);

  return (
    <Tooltip
      title={t('dashboard.connectionStates.label', { label, meta: meta.label })}
      placement="top"
      arrow
    >
      <Box
        role="group"
        aria-label={t('dashboard.connectionStates.label', { label, meta: meta.label })}
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

          <Box display={'flex'} flexDirection="column" gap={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }} noWrap>
              {label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, lineHeight: 1, color: 'text.secondary' }}
              noWrap
            >
              {typeKey === 'software'
                ? BROADCAST_SOFTWARE_NAME_MAP[type]
                : typeKey === 'server'
                  ? SERVER_NAME_MAP[type]
                  : typeKey === 'feed'
                    ? meta.label
                    : null}
            </Typography>
            {(bitrate !== null || speed !== null) && (
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}
                noWrap
              >
                {`${bitrate ?? 0} kbps${speed !== null ? ` | ${speed} kB/s` : ''}`}
              </Typography>
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
                {bitrate !== null ||
                  (speed !== null && (
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 500, color: 'text.secondary', ml: 'auto' }}
                    >
                      {`${bitrate} kbps | ${speed} kB/s`}
                    </Typography>
                  ))}
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
    </Tooltip>
  );
};

const ConnectionStates = ({ isMenu = false }) => {
  const { t } = useTranslation();
  const { statuses, serverType, softwareType, broadcastState } = useConnectionStates();

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
        icon={<StorageRoundedIcon />}
        type={serverType}
        typeKey="server"
        label={t('dashboard.connectionStates.serverTileLabel')}
        status={statuses.server}
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
