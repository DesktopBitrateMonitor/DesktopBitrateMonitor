import { BrowserWindow, shell } from 'electron';
import express from 'express';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import img from '../../assets/icon.png';
import { getTranslationData } from '../lib/translation-picker';
import generateId from '../lib/id-generator';
import createPKCECodes from '../lib/code-verifier';
import { authAPI, fetchChannelMeta, userAuthorization } from '../kick/kick-api';
import {
  connectToKickEventSub,
  disconnectKickEventSub
} from '../kick/event-subscriptions/eventsubs';

const { appConfig, kickAccountsConfig } = injectDefaults();

export const kickRouter = express.Router();

const port = import.meta.env.VITE_SERVERPORT;
const client_id = import.meta.env.VITE_KICKCLIENTID;
const client_secret = import.meta.env.VITE_KICKCLIENTSECRET;
const bot_scopes = import.meta.env.VITE_KICKBOT_SCOPES;
const broadcaster_scopes = import.meta.env.VITE_KICKBROADCASTER_SCOPES;

const authBaseUrl = 'https://id.kick.com';

let type;
let code_verifier;
let code_challenge;

export function startKickAuthorization(authType) {
  type = authType;
  const pkceCodes = createPKCECodes();
  code_verifier = pkceCodes.code_verifier;
  code_challenge = pkceCodes.code_challenge;

  const qs = new URLSearchParams({
    client_id: client_id,
    response_type: 'code',
    redirect_uri: `http://localhost:${port}/oauth/kick`,
    scope: type === 'bot' ? bot_scopes : broadcaster_scopes,
    code_challenge,
    code_challenge_method: 'S256',
    state: generateId(16)
  });

  const url = `${authBaseUrl}/oauth/authorize?${qs}`;
  return url;
}

kickRouter.get('/oauth/kick', async (req, res) => {
  const { code } = req.query;

  const qs = new URLSearchParams({
    client_id,
    client_secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `http://localhost:${port}/oauth/kick`,
    code_verifier
  });

  try {
    const {
      data: { access_token, refresh_token, scope }
    } = await authAPI.post(`/oauth/token?${qs}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const user = await userAuthorization(access_token);

    const data = {
      id: user.user_id,
      login: user.name,
      display_name: user.name,
      access_token,
      refresh_token,
      scopes: scope.split(' '),
      profile_image_url: user.profile_picture
    };

    if (type === 'bot') {
      kickAccountsConfig.set('bot', data);
    } else {
      const metaData = await fetchChannelMeta(user.name);
      const {
        id: channelId,
        chatroom: { id: chatroomId }
      } = metaData;
      data.channelId = channelId;
      data.chatroomId = chatroomId;
      kickAccountsConfig.set('broadcaster', data);
    }

    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.send('send-kick-oauth-data', { userType: type, data });

    if (type === 'broadcaster' && appConfig.get('activePlatforms').includes('kick')) {
      async function connectEventSubs() {
        await disconnectKickEventSub(mainWindow);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await connectToKickEventSub(mainWindow);
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
                    <h1 class="type">${getTranslationData({ lng, key: `authorization.kick.${type}` })}</h1>
                  </div>
                  <h1 class="header">${getTranslationData({ lng, key: 'authorization.kick.header' })}</h1>
                  <p class="sub">${getTranslationData({ lng, key: 'authorization.kick.description' })}</p>
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
    Logger.error(`Error during Kick OAuth callback: ${error.message}`);
  }
});
