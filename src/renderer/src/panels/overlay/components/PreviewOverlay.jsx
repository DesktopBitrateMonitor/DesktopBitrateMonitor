import React, { useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { useOverlayConfigStore } from '../../../contexts/DataContext';

const PreviewOverlay = ({ workingConfig }) => {
  const { overlayConfig } = useOverlayConfigStore();

  const [jsCode, setJsCode] = useState(() => workingConfig.js || '');
  const [htmlCode, setHtmlCode] = useState(() => workingConfig.html || '');
  const [cssCode, setCssCode] = useState(() => workingConfig.css || '');

  const handleRefresh = () => {
    setJsCode(workingConfig.js || '');
    setHtmlCode(workingConfig.html || '');
    setCssCode(workingConfig.css || '');
  };

  useEffect(() => {
    const config = overlayConfig?.overlay || { html: '', css: '', js: '' };

    setJsCode(config.js || '');
    setHtmlCode(config.html || '');
    setCssCode(config.css || '');
  }, [overlayConfig.overlay]);

  return (
    <Box sx={{ mb: 2 }}>
      <IconButton onClick={handleRefresh} size="small" sx={{ mb: 1 }}>
        <SyncIcon />
      </IconButton>
      <iframe
        title="Overlay Preview"
        style={{
          width: '100%',
          height: 240,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4
        }}
        srcDoc={`
          <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${cssCode}</style>
              </head>
              <body>
                ${htmlCode}
                <script>${jsCode}</script>
              </body>
            </html>`}
      />
    </Box>
  );
};

export default PreviewOverlay;
