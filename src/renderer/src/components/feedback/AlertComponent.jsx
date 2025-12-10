import { Slide, Alert } from '@mui/material';

const AlertComponent = ({ alerts }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1%',
        right: '1%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999
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
            variant="filled"
            severity={alert.severity || 'success'}
            sx={{
              maxWidth: '30rem'
            }}
          >
            {alert.message}
          </Alert>
        </Slide>
      ))}
    </div>
  );
};

export default AlertComponent;
