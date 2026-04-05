import WebSocket from 'ws';
import fs from 'fs';
import Logger from '../logging/logger';
import router from './base-router';
import { overlayFilePath } from '../overlay/overlay-router';
import { injectDefaults } from '../store/defaults';

const {overlayConfig} = injectDefaults();

const express = require('express');
const app = express();
app.use(express.json());

const port = import.meta.env.VITE_SERVERPORT;

const server = app.listen(port, () => {
  Logger.log(`App server listening at http://localhost:${port}`);
});

app.use('/', router);

// ---- WEBSOCKET SERVER ---- //

const wss = new WebSocket.Server({ server });

function getOverlayData() {
  const raw = fs.readFileSync(overlayFilePath, 'utf-8');
  return JSON.parse(raw);
}

export function broadcastOverlay(data) {
  const host = overlayConfig.get('host')

  const dataString = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(dataString);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Overlay client connected');

  const data = JSON.stringify({ type: 'overlay', data: getOverlayData() });
  ws.send(data);
});

wss.on('close', () => {
  console.log('Overlay client disconnected');
});
