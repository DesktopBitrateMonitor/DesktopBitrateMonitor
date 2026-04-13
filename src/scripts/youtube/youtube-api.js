import Logger from '../logging/logger';
import { google } from 'googleapis';
import { injectDefaults } from '../store/defaults';

const { youtubeAccountsConfig } = injectDefaults();

const ApiVersion = 'v3';

const port = import.meta.env.VITE_SERVERPORT;
const client_id = import.meta.env.VITE_YOUTUBECLIENTID;
const client_secret = import.meta.env.VITE_YOUTUBECLIENTSECRET;

function createOAuth2Client(credentials = {}) {
  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${port}/oauth/youtube`
  );
  if (Object.keys(credentials).length) {
    client.setCredentials(credentials);
  }
  return client;
}

/**
 * Validates an access token against Google's tokeninfo endpoint.
 * Returns the token info object on success, or null if invalid/expired.
 * @param {string} access_token
 * @returns {object|null}
 */
export async function validateYoutubeAccessToken(access_token) {
  try {
    const client = createOAuth2Client();
    const tokenInfo = await client.getTokenInfo(access_token);
    return tokenInfo;
  } catch (error) {
    Logger.error(`YouTube token validation failed: ${error.message}`);
    return null;
  }
}

/**
 * Refreshes the access token using the stored refresh token.
 * Returns new credentials object on success, or null on failure.
 * @param {string} refresh_token
 * @returns {object|null}
 */
export async function refreshYoutubeAccessToken(refresh_token) {
  try {
    const client = createOAuth2Client({ refresh_token });
    const { credentials } = await client.refreshAccessToken();
    return credentials;
  } catch (error) {
    Logger.error(`YouTube token refresh failed: ${error.message}`);
    return null;
  }
}

/**
 * Validates the access token; if expired/invalid, refreshes it and updates the store.
 * @param {string} access_token
 * @param {string} accountType - 'broadcaster'
 * @returns {Promise<{success: boolean, access_token: string|null, error: string|null}>}
 */
export async function doTokenValidationProcess(access_token, accountType) {
  if (!accountType) {
    return { success: false, access_token: null, error: 'No account type specified' };
  }

  const selectedConfig = youtubeAccountsConfig.get(accountType);

  const valid = await validateYoutubeAccessToken(access_token);
  if (!valid) {
    const newCredentials = await refreshYoutubeAccessToken(selectedConfig.refresh_token);
    if (newCredentials) {
      Logger.log('YouTube access token refreshed...');
      youtubeAccountsConfig.set(accountType, {
        ...selectedConfig,
        access_token: newCredentials.access_token,
        refresh_token: newCredentials.refresh_token ?? selectedConfig.refresh_token,
        expiry_date: newCredentials.expiry_date
      });
      return { success: true, access_token: newCredentials.access_token };
    }
    Logger.error('Failed to refresh YouTube access token.');
    return { success: false, access_token: null, error: 'Token refresh failed' };
  }

  return { success: true, access_token };
}

/**
 * Validates/refreshes the token, then executes the callback with the valid token.
 * @param {string} access_token
 * @param {string} accountType
 * @param {function} callback - receives a valid oauth2Client
 * @returns {Promise<*>} Result of the callback
 */
export async function validateAndProceed(access_token, accountType, callback) {
  const {
    success,
    access_token: validToken,
    error
  } = await doTokenValidationProcess(access_token, accountType);
  if (!success) {
    throw new Error(error ?? 'Unable to validate or refresh YouTube access token.');
  }
  const selectedConfig = youtubeAccountsConfig.get(accountType);
  const client = createOAuth2Client({
    access_token: validToken,
    refresh_token: selectedConfig.refresh_token,
    expiry_date: selectedConfig.expiry_date
  });
  return await callback(client);
}

export async function userAuthorization(client) {
  const youtube = google.youtube({ version: ApiVersion, auth: client });
  try {
    const response = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });
    const data = response.data.items[0];

    return data;
  } catch (error) {
    Logger.error(`Error fetching YouTube user info: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * @typedef {Object} youTubeUserData
 * @property {string} id - The YouTube channel ID.
 * @property {string} login - The YouTube channel name.
 * @property {string} displayName - The display name of the channel.
 * @property {string} avatarUrl - URL to the channel's avatar image.
 */

/**
 * Fetches channel data for the authenticated user.
 * @param {string} access_token
 * @param {string} accountType
 * @param {object} userData
 * @returns {youTubeUserData|null} User data object or null on failure
 */
export async function getYoutubeUsers(access_token, userData, accountType) {
  const userName = userData;

  console.log(userName);

  return validateAndProceed(access_token, accountType, async (client) => {
    const youtube = google.youtube({ version: ApiVersion, auth: client });

    const searchList = await youtube.search.list({
      part: 'snippet',
      q: userName,
      type: 'channel',
      maxResults: 5
    });

    const firstMatch = searchList.data.items?.[0];
    if (!firstMatch?.snippet?.channelId) return;

    const response = await youtube.channels.list({
      part: 'snippet',
      id: firstMatch.snippet.channelId
    });

    const data = response.data.items?.[0];
    if (!data) return;

    const userData = {
      id: data?.id || '',
      login: data?.snippet?.title || '',
      display_name: data?.snippet?.title || '',
      customUrl: data?.snippet?.customUrl || '',
      profile_image_url: data?.snippet?.thumbnails?.default?.url || ''
    };

    return userData;
  });
}

/**
 * Revokes a YouTube access token and clears local credentials for the account.
 * @param {string} access_token
 * @param {string} accountType - 'broadcaster' | 'bot'
 * @returns {Promise<{status: number|string, message: string}>}
 */
export async function revokeYoutubeAccessToken(accountType) {
  try {
    const client = createOAuth2Client();
    const access_token = youtubeAccountsConfig.get(`${accountType}.access_token`);

    if (access_token === '') {
      return { success: false, status: 'error', message: 'No access token found' };
    }

    const res = await client.revokeToken(access_token);
    return { success: true, status: res.status, message: 'Token revoked successfully' };
  } catch (error) {
    Logger.error(`Error revoking YouTube token: ${error.message}`);
    return { success: false, status: 'error', message: error.message };
  }
}
