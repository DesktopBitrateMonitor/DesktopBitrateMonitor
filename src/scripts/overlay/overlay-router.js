import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import { app } from 'electron';
import WebSocket from 'ws';

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
  const data = JSON.parse(fs.readFileSync(overlayFilePath, 'utf-8'));

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>

        <script>
          const ws = new WebSocket("ws://localhost:${PORT}");

          console.log("Connecting to overlay WebSocket...");

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { html, css, js, props } = data;

            // inject HTML
            document.getElementById("root").innerHTML = html;

            // inject CSS
            let style = document.getElementById("overlay-style");
            if (!style) {
              style = document.createElement("style");
              style.id = "overlay-style";
              document.head.appendChild(style);
            }
            style.innerHTML = css;

            // run JS safely
            try {
              window.PROPS = props;
              eval(js);
            } catch (e) {
              console.error("Overlay JS error:", e);
            }
          };
        </script>
      </body>
    </html>
  `);
});
