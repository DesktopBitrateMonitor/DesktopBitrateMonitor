import { ipcMain, BrowserWindow } from 'electron';
import Logger from '../logger';
import { injectDefaults } from '../store/defaults';
import { userAuthorization, authAPI } from './twitch-api';
import { connectToEventSubs, disconnectEventSubs } from './event-subscriptions/eventsubs';
import img from '../../assets/icon.png';

const { chatbotConfig } = injectDefaults();

const express = require('express');
const app = express();
app.use(express.json());

const port = import.meta.env.VITE_SERVERPORT || 9898;
const client_id = import.meta.env.VITE_TWITCHCLIENTID;
const client_secret = import.meta.env.VITE_TWITCHCLIENTSECRET;

app.listen(port, () => {
  console.log(`Auth server listening at http://localhost:${port}`);
});

const authBaseUrl = 'https://id.twitch.tv/oauth2';

export function startAuthorization() {
  const qs = new URLSearchParams({
    client_id: client_id,
    redirect_uri: `http://localhost:${port}/oauth`,
    response_type: 'code',
    scope: 'user:read:chat chat:read chat:edit user:write:chat',
    force_verify: true
  });
  return `${authBaseUrl}/authorize?${qs}`;
}

app.get('/oauth', async (req, res) => {
  const { code } = req.query;

  const qs = new URLSearchParams({
    client_id,
    client_secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `http://localhost:${port}/oauth`
  });

  try {
    const {
      data: { access_token: access_token, refresh_token: refresh_token, scope: scopes }
    } = await authAPI.post(`/token?${qs}`);

    const user = await userAuthorization(access_token);

    const data = {
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      access_token,
      refresh_token,
      scopes,
      profile_image_url: user.profile_image_url
    };

    chatbotConfig.set('id', data.id);
    chatbotConfig.set('login', data.login);
    chatbotConfig.set('display_name', data.display_name);
    chatbotConfig.set('access_token', data.access_token);
    chatbotConfig.set('refresh_token', data.refresh_token);
    chatbotConfig.set('scopes', data.scopes);
    chatbotConfig.set('profile_image_url', data.profile_image_url);

    // Send data to the main process
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('send-oauth-data', data);

    async function connectEventSubs() {
      disconnectEventSubs();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      connectToEventSubs(client_id, chatbotConfig.get(''));
    }
    connectEventSubs();

    res.send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div class="text-container">
            <img class="img" src=${img} alt="../../assets/icon.png" />
            <div>
              <h1 class="type">Chatbot</h1>
            </div>
            <h1 class="header">Authorization Successful</h1>
            <p class="sub">You can close this window now</p>
          </div>
        </body>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
              sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #121212;
          }

          .img {
            position: absolute;
            top: 1rem;
            left: 1rem;
            width: 50px;
          }
          .text-container {
            position: relative;
            margin-top: 1rem;
            padding: 2rem;
            background-color: #fff;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background: rgba(255, 255, 255, 0.069);
          }

          h1 {
            text-align: center;
            color: rgb(234, 234, 234);
          }

          p {
            text-align: center;
            color: rgb(234, 234, 234);
          }
          .type {
            text-align: center;
            color: rgb(234, 234, 234);
          }
        </style>
      </html>
    `);
  } catch (error) {
    Logger.error(`Error getting access token: ${error.message}`);
    console.error(error);
  }
});
