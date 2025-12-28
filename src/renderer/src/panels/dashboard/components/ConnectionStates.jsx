import React from 'react';
import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import { useConnectionStates } from '../../../contexts/ConnectionStatesContext.jsx';

const STATUS_META = {
  connected: { label: 'Connected', tone: 'success' },
  connecting: { label: 'Connecting', tone: 'warning' },
  asynchronous: { label: 'Asynchronous', tone: 'warning' },
  disconnected: { label: 'Disconnected', tone: 'error' },
  unknown: { label: 'Unknown', tone: 'neutral' }
};

const SERVER_NAME_MAP = {
  openirl: 'Open IRL',
  'srt-live-server': 'SRT Live Server'
};

const BROADCAST_SOFTWARE_NAME_MAP = {
  'obs-studio': 'OBS Studio',
  'streamlabs-obs': 'Streamlabs OBS'
};

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
  isLive = false
}) => {
  const theme = useTheme();
  const meta = STATUS_META[status];
  const colors = getToneColors(theme, meta.tone);

  return (
    <Tooltip title={`${label}: ${meta.label}`} placement="top" arrow>
      <Box
        role="group"
        aria-label={`${label} connection ${meta.label}`}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
    </Tooltip>
  );
};

const ConnectionStates = ({ isMenu = false }) => {
  const { statuses, serverType, softwareType, broadcastState, feedStatus } = useConnectionStates();

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 0
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Connection States
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live status
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: isMenu ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))'
            },
            gap: 1
          }}
        >
          <ConnectionTile
            icon={<StorageRoundedIcon />}
            type={serverType}
            typeKey="server"
            label="Server Connection"
            status={statuses.server}
          />
          <ConnectionTile icon={<PersonRoundedIcon />} label="User" status={statuses.chat} />
          <ConnectionTile
            icon={<DesktopWindowsRoundedIcon />}
            label={'Streaming Software'}
            typeKey="software"
            isLive={broadcastState}
            type={softwareType}
            status={statuses.software}
          />
          <ConnectionTile
            icon={<WifiRoundedIcon />}
            label="Stream Feed"
            typeKey="feed"
            status={feedStatus}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default ConnectionStates;
