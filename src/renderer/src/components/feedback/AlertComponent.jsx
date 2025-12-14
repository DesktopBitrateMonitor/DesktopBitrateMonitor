import { Slide, Alert, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const AlertComponent = ({ alerts }) => {
  const getSeverityStyles = (theme, severity) => {
    const palette = theme.palette;
    const map = {
      success: {
        tone: palette.success.main,
        bg: alpha(palette.success.main, theme.palette.mode === 'light' ? 0.10 : 0.18),
        border: alpha(palette.success.main, 0.45),
        icon: palette.success.main
      },
      info: {
        tone: palette.info.main,
        bg: alpha(palette.info.main, theme.palette.mode === 'light' ? 0.10 : 0.18),
        border: alpha(palette.info.main, 0.45),
        icon: palette.info.main
      },
      warning: {
        tone: palette.warning.main,
        bg: alpha(palette.warning.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
        border: alpha(palette.warning.main, 0.50),
        icon: palette.warning.main
      },
      error: {
        tone: palette.error.main,
        bg: alpha(palette.error.main, theme.palette.mode === 'light' ? 0.10 : 0.18),
        border: alpha(palette.error.main, 0.50),
        icon: palette.error.main
      }
    };
    const key = severity && map[severity] ? severity : 'info';
    return map[key];
  };
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1200
      }}
    >
      {alerts.map((alert) => (
        <Slide
          key={alert.id}
          direction={alert.direction || 'left'}
          in={alert.visible !== false}
          mountOnEnter
          unmountOnExit
        >
          <Alert
            variant="outlined"
            severity={alert.severity || 'info'}
            sx={(theme) => {
              const sev = getSeverityStyles(theme, alert.severity || 'info');
              return {
                maxWidth: '32rem',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                borderColor: sev.border,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0,0,0,0.45)'
                    : '0 8px 24px rgba(0,0,0,0.12)',
                color: theme.palette.text.primary,
                background:
                  `linear-gradient(0deg, ${alpha(sev.tone, 0.08)} 0%, ${sev.bg} 100%)`,
                '& .MuiAlert-icon': {
                  color: sev.icon
                },
                '& .MuiAlert-message': {
                  fontSize: 14,
                  lineHeight: 1.5
                }
              };
            }}
            action={
              alert.onClose ? (
                <IconButton size="small" aria-label="Close alert" onClick={alert.onClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : null
            }
          >
            {alert.message}
          </Alert>
        </Slide>
      ))}
    </div>
  );
};

export default AlertComponent;
