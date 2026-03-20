import { BrowserWindow } from 'electron';
import express from 'express';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import { userAuthorization, authAPI } from '../twitch/twitch-api';
import {
  connectToTwitchEventSubs,
  disconnectTwitchEventSubs
} from '../twitch/event-subscriptions/eventsubs';
import img from '../../assets/icon.png';
import { getTranslationData } from '../lib/translation-picker';

const { appConfig, twitchAccountsConfig } = injectDefaults();

export const twitchRouter = express.Router();

const port = import.meta.env.VITE_SERVERPORT;
const client_id = import.meta.env.VITE_TWITCHCLIENTID;
const client_secret = import.meta.env.VITE_TWITCHCLIENTSECRET;
const bot_scopes = import.meta.env.VITE_TWITCHBOT_SCOPES;
const broadcaster_scopes = import.meta.env.VITE_TWITCHBROADCASTER_SCOPES;

const authBaseUrl = 'https://id.twitch.tv/oauth2';

let type;

export function startTwitchAuthorization(authType) {
  type = authType;
  const qs = new URLSearchParams({
    client_id: client_id,
    redirect_uri: `http://localhost:${port}/oauth/twitch`,
    response_type: 'code',
    scope: type === 'bot' ? bot_scopes : broadcaster_scopes,
    force_verify: true
  });
  return `${authBaseUrl}/authorize?${qs}`;
}

twitchRouter.get('/oauth/twitch', async (req, res) => {
  const { code } = req.query;

  const qs = new URLSearchParams({
    client_id,
    client_secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `http://localhost:${port}/oauth/twitch`
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

    if (type === 'bot') {
      twitchAccountsConfig.set('bot', data);
    } else {
      twitchAccountsConfig.set('broadcaster', data);
    }

    // Send data to the main process
    // Search for the main window in all open windows. It should be only one window open, so it should be safe to take the first one.
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('send-twitch-oauth-data', { userType: type, data });

    if (type === 'broadcaster' && appConfig.get('activePlatform') === 'twitch') {
      async function connectEventSubs() {
        await disconnectTwitchEventSubs(mainWindow);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await connectToTwitchEventSubs(client_id, mainWindow);
      }
      connectEventSubs();
    }

    const lng = appConfig.get('language') || 'en';

    res.send(`
      <!doctype html>
      <html lang="${lng}">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div class="text-container">
            <img class="img" src=${img} alt="../../assets/icon.png" />
            <div>
              <h1 class="type">${getTranslationData({ lng, key: `authorization.twitch.${type}` })}</h1>
            </div>
            <h1 class="header">${getTranslationData({ lng, key: 'authorization.twitch.header' })}</h1>
            <p class="sub">${getTranslationData({ lng, key: 'authorization.twitch.description' })}</p>
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
  }
});
