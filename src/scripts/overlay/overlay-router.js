import express from 'express';
import path from 'path';
import os from 'os';
import { app } from 'electron';
import { injectDefaults } from '../store/defaults';

const isDev = import.meta.env.DEV;

export const overlayRouter = express.Router();
const { overlayConfig } = injectDefaults();

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
  const overlayKey = overlayConfig.get('overlayKey');
  const { key } = req.query;

  if (!key) {
    console.warn('Unauthorized overlay access attempt with missing key');
    return res.status(401).send('Key is required');
  }

  if (key !== overlayKey) {
    console.warn(`Unauthorized overlay access attempt with key: ${key}`);
    return res.status(401).send('Unauthorized');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <!-- JQUERY for DOM manipulation -->
        <script src="https://code.jquery.com/jquery-4.0.0.min.js"
          integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
          crossorigin="anonymous"></script>

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
        <script
          src="https://code.jquery.com/jquery-4.0.0.min.js"
          integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
          crossorigin="anonymous"></script>

        <!-- The root element for the overlay content -->
        <div id="root-overlay-element"></div>
       
        <!-- Overlay script -->
        <script>
          let ws;
          let retryAttempts = 0;
          const maxRetryDelay = 5000;

          const overlayState = {
            config: { html: '', css: '', js: '' },
            stats: { bitrate: 0, speed: 0, uptime: 0 }
          };

          const getNestedValue = (obj, path) =>
            path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

          const parseTemplate = (template, values = {}) => {
            if (typeof template !== "string") return template;

            const replaceTokens = (str, regex) =>
              str.replace(regex, (match, key) => {
                const resolved = getNestedValue(values, key.trim());
                return resolved !== undefined ? resolved : match;
              });

            const withDollar = replaceTokens(template, /\$\{(.*?)\}/g);
            return replaceTokens(withDollar, /\{\{(.*?)\}\}/g);
          };

          const applyTemplateToOverlay = (config, vars) => ({
            html: parseTemplate(config.html || '', vars),
            css: parseTemplate(config.css || '', vars),
            js: parseTemplate(config.js || '', vars)
          });

          const buildTemplateVariables = (overlayConfig, modePayload) => {
            const data = (modePayload && modePayload.data) || {};
            const showValue = (flag, visibleValue) => (flag === false ? 'none' : visibleValue);

            return {
              direction: data.direction ?? 'column',
              gap: data.gap ?? 8,
              iconColor: data.iconColor ?? '#580991',
              fontColor: data.fontColor ?? '#580991',
              bitrateDisplay: showValue(overlayConfig.showBitrate, 'flex'),
              speedDisplay: showValue(overlayConfig.showSpeed, 'flex'),
              uptimeDisplay: showValue(overlayConfig.showUptime, 'flex'),
              iconsDisplay: showValue(overlayConfig.showIcons, 'inline-flex')
            };
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

          const handleMessage = (event) => {
            const data = JSON.parse(event.data);

            console.log("Received data from server:", data);

            // Stats payload from the app backend
            if (data.type === "stats") {
              overlayState.stats = normalizeStats(data.stats || {});
              applyOverlay();
              return;
            }

            if (data.type === "overlay") {

              // Overlay configuration payloads
              // - On first connection the server sends the full overlay-config.json
              // - On overlay updates the backend sends the same shape again

              const overlayConfig = data.data || {};

              const expertMode = data.data.expertMode || false;
              const modeKey = expertMode ? "expert" : "easy";

              const overlaysByMode = data.data.overlay || {};
              const overlayPayload = overlaysByMode[modeKey] || { html: '', css: '', js: '', data: {} };

              const templateVars = buildTemplateVariables(overlayConfig, overlayPayload);
              overlayState.config = applyTemplateToOverlay(overlayPayload, templateVars);
              applyOverlay();
            }
          };

          const scheduleReconnect = (reason) => {
            retryAttempts += 1;
            const delay = Math.min(500 + retryAttempts * 500, maxRetryDelay);
            setTimeout(connectWS, delay);
          };

          const connectWS = () => {
            ws = new WebSocket("ws://" + window.location.hostname + ":${PORT}");

            ws.onopen = () => {
              retryAttempts = 0;
              console.log("WebSocket connected to overlay server");
            };

            ws.onmessage = handleMessage;

            ws.onerror = () => {
              console.warn("WebSocket error, closing and retrying");
              try { ws.close(); } catch (_) {}
            };

            ws.onclose = () => scheduleReconnect("closed");
          };

          // Initial connect (will keep retrying if the server is not up yet)
          connectWS();
        </script>
      </body>
    </html>
  `);
});
