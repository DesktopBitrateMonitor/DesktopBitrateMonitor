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

// Need not token validation because the function only is called on the registration process
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
 * @typedef fetchChannelMeta
 * @prop {Number} id The channel's unique identifier.
 * @prop {Number} user_id The user id.
 * @prop {string} slug The channel's slug (name).
 * @prop {boolean} is_banned Indicates if the channel is banned.
 * @prop {string} playback_url The URL for the channel's stream playback.
 * @prop {boolean} vod_enabled Indicates if VODs are enabled for the channel.
 * @prop {boolean} subscription_enabled Indicates if subscriptions are enabled for the channel.
 * @prop {boolean} is_affiliate Indicates if the channel is an affiliate.
 * @prop {boolean} followers_count The number of followers the channel has.
 * @prop {Array} subscriber_badges An array of subscriber badges available for the channel.
 * @prop {string} banner_image The URL of the channel's banner image.
 * @prop {string} livestream ??
 * @prop {string} role ??
 * @prop {Array} follower_badges An array of follower badges available for the channel
 * @prop {string} offline_banner_image The URL of the channel's offline banner image.
 * @prop {boolean} verified Indicates if the channel is verified.
 * @prop {Array} recent_categories An array of recent categories the channel has streamed in.
 * @prop {boolean} can_host Indicates if the channel can host other channels.
 * @prop {object} user An object containing user information for the channel.
 * @prop {Number} user.id The user's unique identifier.
 * @prop {string} user.username The user's username.
 * @prop {boolean} user.agreed_to_terms Indicates if the user has agreed to the terms of service.
 * @prop {string} user.email_verified_at The date and time when the user's email was verified.
 * @prop {string|null} user.bio The user's biography or description.
 * @prop {string|null} user.country The user's country.
 * @prop {string|null} user.state The user's state.
 * @prop {string|null} user.city The user's city.
 * @prop {string|null} user.instagram The user's Instagram handle.
 * @prop {string|null} user.twitter The user's Twitter handle.
 * @prop {string|null} user.youtube The user's YouTube channel.
 * @prop {string|null} user.discord The user's Discord handle.
 * @prop {string|null} user.tiktok The user's TikTok handle.
 * @prop {string|null} user.facebook The user's Facebook profile.
 * @prop {string|null} user.gender The user's gender.
 * @prop {string|null} user.profile_pic The URL of the user's profile picture.
 * @prop {object} chatroom An object containing chatroom information for the channel.
 * @prop {Number} chatroom.id The chatroom's unique identifier.
 * @prop {string} chatroom.chatable_type The type of entity the chatroom is associated with (e.g., "App\\Models\\Channel").
 * @prop {Number} chatroom.channel_id The unique identifier of the channel associated with the chatroom.
 * @prop {string} chatroom.created_at The date and time when the chatroom was created.
 * @prop {string} chatroom.updated_at The date and time when the chatroom was last updated.
 * @prop {string} chatroom.chat_mode_old The previous chat mode of the chatroom (e.g., "public", "subscribers", "followers").
 * @prop {string} chatroom.chat_mode The current chat mode of the chatroom (e.g., "public", "subscribers", "followers").
 * @prop {boolean} chatroom.slow_mode Indicates if slow mode is enabled for the chatroom.
 * @prop {Number} chatroom.chatable_id The unique identifier of the entity the chatroom is associated with (e.g., channel ID).
 * @prop {boolean} chatroom.followers_mode Indicates if followers-only mode is enabled for the chatroom.
 * @prop {boolean} chatroom.subscribers_mode Indicates if subscribers-only mode is enabled for the chatroom.
 * @prop {boolean} chatroom.emotes_mode Indicates if emotes-only mode is enabled for the chatroom.
 * @prop {Number} chatroom.message_interval The minimum interval in seconds between messages for users when slow mode is enabled.
 * @prop {Number} chatroom.following_min_duration The minimum duration in minutes that a user must have been following the channel to chat when followers-only mode is enabled.
 */

/**
 *
 * @param {String} broadcasterLogin The broadcaster's channel login name (slug)
 * @returns {fetchChannelMeta|null} The channel metadata or null if not found
 */

export async function fetchChannelMeta(broadcasterLogin) {
  const data = await channelDataAPI.get(`v2/channels/${broadcasterLogin}`, {
    // Change back to "Desktop Bitrate Monitor" if not work anymore!
    headers: { 'User-Agent': 'Desktop Bitrate Monitor' }
  });
  return data.data || null;
}

/**
 * @typedef refreshKickAccessToken
 * @prop {string} access_token The new access token.
 * @prop {string} token_type "user" or "app"
 * @prop {string} refresh_token The new refresh token.
 * @prop {string} expires_in The token expiration time in seconds.
 * @prop {string} scope An string of used scopes.
 */

/**
 *
 * @param {string} refresh_token
 * @returns {refreshKickAccessToken|null}
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
 * @typedef validateKickAccessToken
 * @prop {boolean} active Indicates if the token is active.
 * @prop {string} client_id The client ID associated with the token.
 * @prop {string} token_type The type of the token ("user" or "app").
 * @prop {string} scope A string of scopes associated with the token.
 * @prop {number} exp The token expiration time in seconds.
 */

/**
 *
 * @param {String} access_token The Users or App access token
 * @returns {object|null} The token introspection data or null if invalid
 */

export async function validateKickAccessToken(access_token) {
  try {
    const data = await authAPI.post('/oauth/token/introspect', null, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    return data.data || null;
  } catch (error) {
    Logger.error(`Error during Kick OAuth token validation: ${error.message}`);
    return false;
  }
}

/**
 *
 * @param {string} access_token The access token to validate
 * @param {string} accountType The account type ("broadcaster" or "bot") to determine which config to use for refreshing the token if validation fails
 * @returns {Promise<{success: boolean, access_token: string|null, error: string|null}>} The result of the token validation process
 */

export async function doTokenValidationProcess(access_token, accountType) {
  if (!accountType) {
    return { success: false, access_token: null, error: 'No account type specified' };
  }
  const selectedConfig =
    accountType === 'broadcaster'
      ? kickAccountsConfig.get('broadcaster')
      : kickAccountsConfig.get('bot');
  const validAccessToken = await validateKickAccessToken(access_token);
  if (!validAccessToken) {
    const refresh_token = selectedConfig.refresh_token;
    const newAccessToken = await refreshKickAccessToken(refresh_token);
    if (newAccessToken) {
      Logger.log('Kick Access Token refreshed...');

      kickAccountsConfig.set(`${accountType}`, {
        ...selectedConfig,
        access_token: newAccessToken.access_token,
        refresh_token: newAccessToken.refresh_token
      });
      return { access_token: newAccessToken.access_token, success: true };
    } else {
      Logger.error('Failed to refresh Kick access token...');
      return { success: false, access_token: null };
    }
  }
  return { success: true, access_token };
}

export async function validateAndProceed(access_token, accountType, callback) {
  const { access_token: validToken, success } = await doTokenValidationProcess(
    access_token,
    accountType
  );
  if (!success) {
    throw new Error('Unable to validate or refresh Kick access token.');
  }
  return await callback(validToken);
}

/**
 * @typedef getUser
 * @prop {Number} id The user's unique identifier.
 * @prop {string} login The user's login name.
 * @prop {string} display_name The user's display name.
 * @prop {string} profile_image_url The user's profile image URL.
 */

/**
 * @param {string} access_token The access token to use for authentication.
 * @param {string} username The username of the Kick user to fetch.
 * @return {object|null} The result of the user fetch operation.
 */

export async function getUser(access_token, username) {
  return await validateAndProceed(access_token, 'broadcaster', async (validToken) => {
    const res = await fetchChannelMeta(username);
    if (!res) return null;
    const userId = res?.user_id;

    const qs = new URLSearchParams({
      id: userId
    });

    const {
      data: { data }
    } = await kickApi.get(`/v1/users?${qs}`, {
      headers: {
        Authorization: `Bearer ${validToken}`
      }
    });

    const returnData = {
      id: data[0].user_id,
      login: data[0].name,
      display_name: data[0].name,
      profile_image_url: data[0].profile_picture
    };

    return returnData || null;
  });
}

/**
 * @typedef getStreamInfo
 * @prop {Number} broadcaster_user_id The broadcaster's unique identifier.
 * @prop {object} category An object containing information about the stream's category.
 * @prop {boolean} has_mature_content Indicates if the stream has mature content.
 * @prop {string} language The language of the stream.
 * @prop {string} profile_picture The URL of the broadcaster's profile picture.
 * @prop {string} slug The broadcaster's channel slug (name).
 * @prop {string} started_at The date and time when the stream started.
 * @prop {string} stream_title The title of the stream.
 * @prop {string} thumbnail The URL of the stream's thumbnail image.
 * @prop {Number} viewer_count The current number of viewers watching the stream.
 */

/**
 * @param {string} access_token The access token to use for authentication.
 * @param {string|number} broadcaster_user_id The ID of the broadcaster's channel.
 * @returns {Promise<getStreamInfo|null>} The result of the stream info fetch operation.
 */

export async function getStreams(access_token, broadcaster_user_id) {
  return await validateAndProceed(access_token, 'broadcaster', async (validToken) => {
    const qs = new URLSearchParams({
      broadcaster_user_id
    });
    const {
      data: { data }
    } = await kickApi.get(`/v1/livestreams?${qs}`, {
      headers: {
        Authorization: `Bearer ${validToken}`
      }
    });

    const returnData = {
      channel_Id: data[0]?.channel_id || '',
      title: data[0]?.stream_title || '',
      directory: data[0]?.category?.name || '',
      directory_thumbnail: data[0]?.category?.thumbnail || '',
    };

    return returnData;
  });
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

export async function revokeKickAccessToken(access_token) {
  try {
    const qs = new URLSearchParams({
      token: access_token
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
  return await validateAndProceed(access_token, accountType, async (validToken) => {
    const body = {
      broadcaster_user_id,
      type: 'user',
      content: message
    };
    try {
      const res = await kickApi.post('/v1/chat', body, {
        headers: {
          Authorization: `Bearer ${validToken}`,
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
  });
}
