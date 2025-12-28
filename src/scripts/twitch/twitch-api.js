import axios from 'axios';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';

const { accountsConfig } = injectDefaults();

const authBaseUrl = 'https://id.twitch.tv/oauth2';
export const authAPI = axios.create({
  baseURL: authBaseUrl
});

const helixBaseUrl = 'https://api.twitch.tv/helix';
export const helixAPI = axios.create({
  baseURL: helixBaseUrl
});

const client_id = import.meta.env.VITE_TWITCHCLIENTID;
const client_secret = import.meta.env.VITE_TWITCHCLIENTSECRET;

/**
 * @param {string} access_token Requires an app access token or user access token.
 * @param {string} user_id
 * @param {string} user_name
 * @return {userAuthorization} Data[]
 */

export async function userAuthorization(access_token) {
  const {
    data: { data }
  } = await helixAPI.get(`/users`, {
    headers: {
      'Client-ID': client_id,
      Authorization: `Bearer ${access_token}`
    }
  });
  return data[0] || null;
}

/**
 * @typedef getAccessToken
 * @prop {string} access_token The new access token.
 * @prop {string} refresh_token The new refresh token.
 * @prop {string} scope An array of used scopes.
 * @prop {string} token_type The token type.
 */

/**
 * @param {string} refresh_token Requires an app access token or user access token.
 * @return {getAccessToken}
 */

export async function getAccessToken(refresh_token) {
  try {
    const qs = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id,
      client_secret
    });
    const { data } = await authAPI.post(`/token?${qs}`);
    return data;
  } catch (error) {
    Logger.error('Token validation error:', error.response ? error.response.data : error.message);
    return null;
  }
}

export async function doTokenValidationProcess(access_token, accountType) {
  if (!accountType) {
    return { success: false, access_token: null, error: 'No account type specified' };
  }
  const selectedConfig =
    accountType === 'broadcaster' ? accountsConfig.get('broadcaster') : accountsConfig.get('bot');

  const validAccessToken = await validateAccessToken(access_token);
  if (!validAccessToken) {
    const refresh_token = selectedConfig.refresh_token;
    const newAccessToken = await getAccessToken(refresh_token);
    if (newAccessToken) {
      Logger.log(`Access token refreshed...`);

      accountsConfig.set(`${accountType}`, {
        ...selectedConfig,
        access_token: newAccessToken.access_token,
        refresh_token: newAccessToken.refresh_token
      });
      return { access_token: newAccessToken.access_token, success: true };
    } else {
      Logger.log(`Failed to refresh access token...`);
      return { access_token: null, success: false };
    }
  }
  return { access_token: access_token, success: true };
}

export async function validateAndProceed(access_token, accountType, callback) {
  const { access_token: validToken, success } = await doTokenValidationProcess(
    access_token,
    accountType
  );
  if (!success) {
    throw new Error('Unable to validate or refresh access token.');
  }
  return await callback(validToken);
}

/**
 * @typedef getUsers
 * @prop {string} id
 * @prop {string} login
 * @prop {string} display_name
 * @prop {string} type
 * @prop {string} broadcaster_type
 * @prop {string} description
 * @prop {string} profile_image_url
 * @prop {string} offline_image_url
 * @prop {string} view_count
 * @prop {string} email
 * @prop {string} created_at
 */

/**
 * @param {string} access_token Requires an app access token or user access token.
 * @param {string} user_id OR user_name
 * @param {string} accountType 'broadcaster' or 'bot'
 * @return {getUsers} Data[]
 */

export async function getUsers(access_token, userData, accountType) {
  return validateAndProceed(access_token, accountType, async (validToken) => {
    let qs;
    userData.user_id
      ? (qs = new URLSearchParams({
          id: userData.user_id
        }))
      : (qs = new URLSearchParams({
          login: userData.user_name
        }));
    const {
      data: { data }
    } = await helixAPI.get(`/users?${qs}`, {
      headers: {
        'Client-ID': client_id,
        Authorization: `Bearer ${validToken}`
      }
    });
    return data[0];
  });
}

/**
 * @typedef validateAccessToken
 * @prop {string} client_id
 * @prop {string} login
 * @prop {array} scopes
 * @prop {string} user_id
 * @prop {number} expires_in
 */

/**
 *
 * @param {string} access_token
 * @returns {validateAccessToken} data[]
 */
export async function validateAccessToken(access_token) {
  try {
    const { data } = await authAPI.get('/validate', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    Logger.log('Token validation successful:', {
      user_id: data.user_id,
      login: data.login,
      expires_in: data.expires_in
    });
    return data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      Logger.log('Token is invalid or expired (401)');
    } else {
      Logger.error('Token validation error:', error.response ? error.response.data : error.message);
    }
    return null;
  }
}

export async function sendChatMessage(
  access_token,
  broadcaster_id,
  sender_id,
  message,
  reply_parent_message_id = null
) {
  return await validateAndProceed(access_token, async (validToken) => {
    const body = {
      broadcaster_id,
      sender_id: sender_id,
      message,
      reply_parent_message_id: reply_parent_message_id
    };
    try {
      const {
        data: { data }
      } = await helixAPI.post(`/chat/messages`, body, {
        headers: {
          'Client-ID': client_id,
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: data };
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * @typedef revokeAccessToken
 * @prop {string} access_token
 */

/**
 *
 * @param {string} access_token The access token to revoke
 * @returns Status 200 on success, 400 on error
 */

export async function revokeAccessToken(access_token) {
  try {
    const qs = new URLSearchParams({
      client_id,
      token: access_token
    });
    const data = await authAPI.post(`/revoke?${qs}`);
    const resData = { status: data.status, message: data.statusText };
    return resData;
  } catch (error) {
    const resData = {
      status: error.response.data.status,
      message: error.response.data.message
    };
    return resData;
  }
}
