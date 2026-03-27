import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useStreamStats } from '../../../contexts/StreamStatsContext';

const PreviewOverlay = ({ workingConfig, fullWidth = false, ...props }) => {
  const { stats } = useStreamStats();
  const [previewConfig, setPreviewConfig] = useState({ html: '', css: '', js: '' });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPreviewConfig({
        html: workingConfig.html || '',
        css: workingConfig.css || '',
        js: workingConfig.js || ''
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [workingConfig]);

  const overlayStats = useMemo(() => {
    const bitrate = Number(stats?.bitrate) || 0;
    const speed = Number(stats?.rtt) || 0;
    const uptime = Number(stats?.uptime) || 0;

    return { bitrate, speed, uptime };
  }, [stats]);

  const srcDoc = useMemo(() => {
    const statsJson = JSON.stringify(overlayStats);

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!-- JQUERY for DOM manipulation -->
          <script
            src="https://code.jquery.com/jquery-4.0.0.min.js"
            integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
            crossorigin="anonymous"></script>          
          <style>${previewConfig.css || ''}</style>
        </head>
        <body>
          ${previewConfig.html || ''}
          <script
            src="https://code.jquery.com/jquery-4.0.0.min.js"
            integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
            crossorigin="anonymous"></script>          
          <script>
            window.overlayStats = ${statsJson};
            window.PROPS = window.overlayStats;
          </script>
          <script>${previewConfig.js || ''}</script>
        </body>
      </html>`;
  }, [overlayStats, previewConfig]);

  return (
    <Box sx={{ mb: 2 }} {...props}>
      <iframe
        title="Overlay Preview"
        style={{
          width: fullWidth ? '100%' : '50%',
          height: 200,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4
        }}
        srcDoc={srcDoc}
      />
    </Box>
  );
};

export default PreviewOverlay;
