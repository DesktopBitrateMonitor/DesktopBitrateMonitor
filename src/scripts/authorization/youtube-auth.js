import { BrowserWindow } from 'electron';
import { google } from 'googleapis';
import express from 'express';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
// import { userAuthorization, authAPI } from "../youtube/youtube-api";
import img from '../../assets/icon.png';
import { getTranslationData } from '../lib/translation-picker';
import generateId from '../lib/id-generator';
import { userAuthorization } from '../youtube/youtube-api';

const { appConfig, youtubeAccountsConfig } = injectDefaults();

export const youtubeRouter = express.Router();

const port = import.meta.env.VITE_SERVERPORT;
const client_id = import.meta.env.VITE_YOUTUBECLIENTID;
const client_secret = import.meta.env.VITE_YOUTUBECLIENTSECRET;
const scope = import.meta.env.VITE_YOUTUBE_SCOPES;

let type;
let state;
let oauth2Client;

export async function startYoutubeAuthorization(authType) {
  oauth2Client = null;
  type = authType;
  state = generateId(32);

  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${port}/oauth/youtube`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scope,
    state: state
  });

  return authUrl;
}

youtubeRouter.get('/oauth/youtube', async (req, res) => {
  const { code, state: returnedState } = req.query;

  if (req?.query?.error) {
    Logger.error(`Error during YouTube OAuth flow: ${req.query.error}`);
    return res.status(400).send(`Error: ${req.query.error}`);
  }

  if (state !== returnedState) {
    Logger.error('State mismatch in YouTube OAuth flow');
    return res.status(400).send('State mismatch');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const user = await userAuthorization(oauth2Client);

    const data = {
      id: user.id,
      login: user.snippet?.title || user.snippet?.customUrl,
      display_name: user.snippet?.title || user.snippet?.customUrl,
      customUrl: user.snippet?.customUrl || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scopes: Array.isArray(tokens.scope) ? tokens.scope : tokens.scope.split(' '),
      profile_image_url: user.snippet.thumbnails?.default?.url || ''
    };

    if (type === 'broadcaster') {
      youtubeAccountsConfig.set('broadcaster', data);
    } else if (type === 'bot') {
      youtubeAccountsConfig.set('bot', data);
    }

    // Send data to the main process
    // Search for the main window in all open windows.
    // It should be only one window open, so it should be safe to take the first one.
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('send-youtube-oauth-data', { userType: type, data });

    if (type === 'broadcaster' && appConfig.get('activePlatform') === 'youtube') {
      // TODO: implement messages fetching from the channels live stream endpoint
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
                    <h1 class="type">${getTranslationData({ lng, key: `authorization.youtube.${type}` })}</h1>
                  </div>
                  <h1 class="header">${getTranslationData({ lng, key: 'authorization.youtube.header' })}</h1>
                  <p class="sub">${getTranslationData({ lng, key: 'authorization.youtube.description' })}</p>
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
    Logger.error(`Error during YouTube OAuth callback: ${error.message}`);
  }
});
