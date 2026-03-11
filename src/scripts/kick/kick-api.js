import axios from 'axios';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';

const { kickAccountsConfig } = injectDefaults();

const authBaseUrl = 'https://id.kick.com/';
export const authAPI = axios.create({
  baseURL: authBaseUrl
});

const apiBaseUrl = 'https://api.kick.com/public';
export const kickApi = axios.create({
  baseURL: apiBaseUrl
});

const channelDataBaseUrl = 'https://kick.com/api';
export const channelDataAPI = axios.create({
  baseURL: channelDataBaseUrl
});

const client_id = import.meta.env.VITE_KICKCLIENTID;
const client_secret = import.meta.env.VITE_KICKCLIENTSECRET;

//TODO: Add token validation and refresh logic like twitch for kick as well.
// 1. Check if the access token is valid before making API calls.
// 2. If the token is invalid or expired, use the refresh token to get a new access token.
// 3. Update the stored access token and refresh token in the app's state and storage.
// 4. Retry the original API call with the new access token after refreshing.

/**
 *
 * @param {string} access_token The Users Access token
 * @returns {Promise<object|null>} The user data or null if not found
 */

export async function userAuthorization(access_token) {
  const {
    data: { data }
  } = await kickApi.get(`/v1/users`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
  return data[0] || null;
}

/**
 *
 * @param {String} broadcasterLogin The broadcaster's channel login name (slug)
 * @returns {object|null} The channel metadata or null if not found
 */
export async function fetchChannelMeta(broadcasterLogin) {
  const data = await channelDataAPI.get(`v2/channels/${broadcasterLogin}`, {
    headers: { 'User-Agent': 'Desktop Bitrate Monitor' }
  });
  return data.data || null;
}

/**
 * @typedef getKickAccessToken
 * @prop {string} access_token The new access token.
 * @prop {string} refresh_token The new refresh token.
 * @prop {string} scope An string of used scopes.
 * @prop {string} token_type The token type.
 */

/**
 *
 * @param {string} refresh_token
 * @returns {getKickAccessToken|null}
 */
export async function refreshKickAccessToken(refresh_token) {
  try {
    const qs = new URLSearchParams({
      refresh_token,
      client_id,
      client_secret,
      grant_type: 'refresh_token'
    });
    const { data } = await authAPI.post(`/oauth/token?${qs}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data;
  } catch (error) {
    Logger.error(`Error during Kick OAuth token refresh: ${error.message}`);
  }
}

/**
 * - Sends a chat message to a Kick channel.
 * - If the accountType is 'bot', the message will always send from the bot account to channel which is included in the access_token.
 *
 * @param {string} access_token The user's access token.
 * @param {string} accountType The type of account sending the message ('bot' or 'user').
 * @param {string} broadcaster_user_id The ID of the broadcaster's channel.
 * @param {string} message The message content to send.
 * @returns {Promise<{success: boolean, error: string|null}>} The result of the message send operation.
 */
export async function sendChatMessage(access_token, accountType, broadcaster_user_id, message) {
  const body = {
    broadcaster_user_id,
    type: accountType === 'bot' ? 'bot' : 'user',
    content: message
  };
  try {
    const res = await kickApi.post('/v1/chat', body, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 200) {
      Logger.log('Chat message sent successfully');
      return { success: true, error: null };
    } else {
      Logger.error(`Failed to send chat message: ${res.statusText}`);
      return { success: false, error: res.statusText };
    }
  } catch (error) {
    Logger.error(
      `Error sending chat message: ${error.response ? error.response.data : error.message}`
    );
    return { success: false, error: error.message };
  }
}

/**
 * @typedef revokeKickAccessToken
 * @prop {string} access_token
 */

/**
 *
 * @param {string} access_token The access token to revoke
 * @returns Status 200 on success, 400 on error
 */

export async function revokeKickAccessToken(token) {
  try {
    const qs = new URLSearchParams({
      token
    });
    const data = await authAPI.post(`/oauth/revoke?${qs}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const resData = { status: data.status, message: data.statusText };
    return resData;
  } catch (error) {
    Logger.error(`Error during Kick OAuth token revocation: ${error.message}`);
    console.log(error);
    return { status: 'error', message: error.message };
  }
}
