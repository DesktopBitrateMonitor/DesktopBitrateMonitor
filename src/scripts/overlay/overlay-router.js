import express from 'express';
import path from 'path';
import os from 'os';
import { app } from 'electron';

export const overlayRouter = express.Router();

const PORT = import.meta.env.VITE_SERVERPORT;

const baseDir =
  process.platform === 'win32'
    ? path.join(os.homedir(), 'AppData', 'Roaming')
    : process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.config');

const fileName = 'overlay-config.json';
const folderPath = path.join(baseDir, app.name);

export const overlayFilePath = path.join(folderPath, fileName);

overlayRouter.get('/overlay/stats', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <link rel="preload" href="https://code.jquery.com/jquery-3.6.0.min.js" as="script" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
            overflow: hidden;
          }
        </style>

      </head>
      <body id="overlay-root">

        <!-- JQUERY for DOM manipulation -->
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>


        <!-- The root element for the overlay content -->
        <div id="root-overlay-element"></div>
       
        <!-- Overlay script -->
        <script>
          const ws = new WebSocket("ws://localhost:${PORT}");
          const overlayState = {
            config: { html: '', css: '', js: '' },
            stats: { bitrate: 0, speed: 0, uptime: 0 }
          };

          const normalizeStats = (stats = {}) => {
            const bitrate = Number(stats.bitrate) || 0;
            const speed = Number(stats.rtt) || 0;
            const uptime = Number(stats.uptime) || 0;

            return { bitrate, speed, uptime };
          };

          const applyOverlay = () => {
            const root = document.getElementById("root-overlay-element");
            const currentConfig = overlayState.config || {};
            const currentStats = overlayState.stats || { bitrate: 0, speed: 0, uptime: 0 };

            root.innerHTML = currentConfig.html || '';

            let style = document.getElementById("root-overlay-style");
            if (!style) {
              style = document.createElement("style");
              style.id = "root-overlay-style";
              document.head.appendChild(style);
            }
            style.innerHTML = currentConfig.css || '';

            window.overlayStats = currentStats;
            window.PROPS = window.overlayStats;

            try {
              eval(currentConfig.js || '');
            } catch (e) {
              console.error("Overlay JS error:", e);
            }
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "stats") {
              overlayState.stats = normalizeStats(data.stats || {});
              applyOverlay();
              return;
            }

            const overlayPayload = data?.overlay || data?.config || data || {};
            overlayState.config = {
              html: overlayPayload.html || '',
              css: overlayPayload.css || '',
              js: overlayPayload.js || ''
            };
            applyOverlay();
          };
        </script>
      </body>
    </html>
  `);
});
