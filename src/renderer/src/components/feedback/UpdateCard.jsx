import React from 'react';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useUpdate } from '../../contexts/UpdateContext';
import { useTranslation } from 'react-i18next';

const formatDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
};

const formatBytes = (size) => {
  if (typeof size !== 'number' || Number.isNaN(size)) return null;
  if (size === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(k)));
  const value = size / k ** i;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
};

const releaseNotesStyles = (theme) => ({
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.35)
      : alpha(theme.palette.background.paper, 0.75),
  padding: theme.spacing(2.25),
  color: theme.palette.text.primary,
  fontSize: 15,
  lineHeight: 1.6,
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    margin: '0 0 0.5rem',
    fontWeight: 700,
    lineHeight: 1.35
  },
  '& p': {
    margin: '0 0 0.85rem'
  },
  '& ul, & ol': {
    margin: '0 0 1rem',
    paddingLeft: '1.5rem',
    listStylePosition: 'outside'
  },
  '& li': {
    marginBottom: '0.35rem'
  },
  '& strong': { fontWeight: 700 },
  '& em': { fontStyle: 'italic' },
  '& .contains-task-list': {
    listStyleType: 'disc',
    listStylePosition: 'outside',
    paddingLeft: '1.6rem',
    margin: '0 0 1rem'
  },
  '& .task-list-item': {
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '0.6rem',
    paddingLeft: 0,
    position: 'relative'
  },
  '& .task-list-item-checkbox': {
    width: 16,
    height: 16,
    accentColor: theme.palette.primary.main,
    margin: '0 0.35rem 0 -1.6rem',
    alignSelf: 'flex-start'
  },
  '& code': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.92rem',
    background: alpha(theme.palette.text.primary, 0.06),
    padding: '0.15rem 0.35rem',
    borderRadius: 6
  },
  '& pre': {
    overflow: 'auto',
    padding: '0.75rem',
    borderRadius: 8,
    background: alpha(theme.palette.text.primary, 0.08)
  },
  '& blockquote': {
    margin: '0 0 0.75rem',
    paddingLeft: '0.75rem',
    borderLeft: `3px solid ${alpha(theme.palette.text.primary, 0.35)}`,
    color: alpha(theme.palette.text.primary, 0.85)
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none'
  },
  '& a:hover': {
    textDecoration: 'underline'
  }
});

const UpdateCard = ({ open = true, onClose }) => {
  const { status, data, startUpdate } = useUpdate();

  const { t } = useTranslation();

  const notesHtml = data?.releaseNotes?.trim();
  const releaseName = data?.releaseName || data?.version;
  const releaseDate = formatDate(data?.releaseDate);
  const fileSize = formatBytes(data?.files?.[0]?.size);
  const isBusy = ['checking-for-update', 'downloading', 'installing'].includes(status);
  const totalBytes = formatBytes(data?.total);
  const transferredBytes = formatBytes(data?.transferred);
  const bytesPerSecond = formatBytes(data?.bytesPerSecond);

  if (status === 'update-available') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: (theme) => ({
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.45)}`,
              overflow: 'hidden'
            })
          }
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('appSettings.update.dialog.updateAvailable.header')} - {releaseName}
              </Typography>
              {releaseDate ? (
                <Typography variant="body2" color="text.secondary">
                  {t('appSettings.update.dialog.updateAvailable.released')} {releaseDate}
                </Typography>
              ) : null}
              {fileSize ? (
                <Typography variant="body2" color="text.secondary">
                  {t('appSettings.update.dialog.updateAvailable.fileSize')} {fileSize}
                </Typography>
              ) : null}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton aria-label="Close update dialog" onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Divider />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            {t('appSettings.update.dialog.updateAvailable.releaseNotes')}
          </Typography>
          {notesHtml ? (
            <Box
              component="section"
              aria-label="Release notes"
              sx={(theme) => ({
                ...releaseNotesStyles(theme),
                maxHeight: '45vh',
                overflowY: 'auto'
              })}
              dangerouslySetInnerHTML={{ __html: notesHtml }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('appSettings.update.dialog.updateAvailable.noReleaseNotes')}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" disableElevation onClick={startUpdate} disabled={isBusy}>
            {t('appSettings.update.dialog.updateAvailable.installButton')}
          </Button>
          <Button onClick={onClose} variant="outlined">
            {t('appSettings.update.dialog.updateAvailable.laterButton')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (status === 'update-app') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: (theme) => ({
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.45)}`
            })
          }
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          {t('appSettings.update.dialog.updateApp.header')}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {t('appSettings.update.dialog.updateApp.description')}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (status === 'download-progress') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: (theme) => ({
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.45)}`
            })
          }
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>Downloading update...</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {t('appSettings.update.dialog.downloadProgress.header')}
          </Typography>
          {totalBytes && transferredBytes && (
            <Box mt={2} mb={1}>
              <LinearProgress
                variant="determinate"
                value={(data?.transferred / data?.total) * 100}
                sx={{ my: 1 }}
              />

              <Typography variant="body2" color="text.secondary">
                {t('appSettings.update.dialog.downloadProgress.progress', {
                  progress: ((data?.transferred / data?.total) * 100).toFixed(1)
                })}
              </Typography>
            </Box>
          )}
          {bytesPerSecond && (
            <Typography variant="body2" color="text.secondary">
              {t('appSettings.update.dialog.downloadProgress.speed', { speed: bytesPerSecond })}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.45)}`
          })
        }
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        {t('appSettings.update.dialog.noUpdateAvailable.header')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary">
          {t('appSettings.update.dialog.noUpdateAvailable.description')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" disableElevation>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateCard;
