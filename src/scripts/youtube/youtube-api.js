import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import {
  getActiveLivestreamId,
  getCachedActiveLivestreamId,
  getCurrentLiveChatInstance
} from './chat-fetching/chat-fetcher';
import { isYoutubeReauthRequiredError, withYoutubeRetry } from '../authorization/youtube-auth';

const { youtubeAccountsConfig } = injectDefaults();

function normalizeChannelName(channelName) {
  return channelName.startsWith('@') ? channelName : '@' + channelName;
}

/**
 * @typedef {Object} getYoutubeChannelByName
 * @property {string} id - The YouTube channel ID.
 * @property {string} login - The YouTube channel name.
 * @property {string} display_name - The display name of the channel.
 * @property {string} customUrl - The custom URL of the channel.
 * @property {string} profile_image_url - URL to the channel's avatar image.
 */

/**
 * Fetches YouTube channel data by searching for a username (no authentication needed).
 * Extracts channel ID and metadata from the public channel page.
 * @param {string} channelName - Channel name, handle (@username), or custom URL
 * @returns {getYoutubeChannelByName} Channel data or null on failure
 */
export async function getYoutubeChannelByName(channelName) {
  if (!channelName || typeof channelName !== 'string') {
    Logger.error('Invalid channel name provided');
    return null;
  }

  try {
    const url = `https://www.youtube.com/${normalizeChannelName(channelName)}`;

    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();

    // Extract initial data from the page
    // YouTube embeds channel data in a script tag
    let match = html.match(/var\s+ytInitialData\s*=\s*({.+?});/s);

    if (!match) return null;

    const jsonStr = match[1];
    const data = JSON.parse(jsonStr);

    // Extract channel header data
    const channelData = extractChannelData(data);
    if (channelData) {
      return channelData;
    }

    Logger.warn(`Channel not found for name: ${channelName}`);
    return null;
  } catch (error) {
    Logger.error(`Error fetching YouTube channel: ${error.message}`);
    return null;
  }
}

/**
 * @typedef {Object} getYoutubeUserByName
 * @property {string} id - The YouTube channel ID.
 * @property {string} login - The YouTube channel name.
 * @property {string} display_name - The display name of the channel.
 * @property {string} customUrl - The custom URL of the channel (if any).
 * @property {string} profile_image_url - URL to the channel's avatar image.
 */

/**
 * Extracts channel information from YouTube's initial data JSON.
 * @param {object} data - The user data object extracted from YouTube's page
 * @returns {getYoutubeUserByName}
 */
function extractChannelData(data) {
  try {
    const header = data?.metadata?.channelMetadataRenderer;
    if (!header) return null;

    const title = data?.metadata?.channelMetadataRenderer?.title || '';
    const channelId = data?.metadata?.channelMetadataRenderer?.externalId || '';
    const vanityUrl = data?.metadata?.channelMetadataRenderer?.vanityChannelUrl || '';
    const customUrl = vanityUrl.split('http://www.youtube.com/')?.[1] || '';

    // Try to find avatar
    let profileImageUrl = '';
    const avatar =
      data?.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url.replace(
        '=s900',
        '=s72'
      ) ||
      data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel
        ?.avatar?.avatarViewModel?.image?.sources?.[0]?.url ||
      '';
    if (avatar) {
      profileImageUrl = avatar;
    }

    if (!channelId) {
      // Try alternative method - extract from canonical URL
      const canonical = data?.microformat?.microformatDataRenderer?.urlCanonical;
      if (canonical && canonical.includes('/channel/')) {
        const extractedId = canonical.split('/channel/')[1].split('?')?.[0];
        if (extractedId) {
          return {
            id: extractedId,
            login: customUrl,
            display_name: title,
            customUrl,
            profile_image_url: profileImageUrl
          };
        }
      }
      return null;
    }

    return {
      id: channelId,
      login: customUrl,
      display_name: title,
      customUrl,
      profile_image_url: profileImageUrl
    };
  } catch (error) {
    Logger.error(`Error extracting channel data: ${error.message}`);
    return null;
  }
}

/**
 * @typedef {Object} getYoutubeUserByName
 * @property {string} id - The YouTube channel ID.
 * @property {string} login - The YouTube channel name.
 * @property {string} display_name - The display name of the channel.
 * @property {string} customUrl - The custom URL of the channel (if any).
 * @property {string} profile_image_url - URL to the channel's avatar image.
 */

/**
 * Read public channeldata from a user.
 * @param {string} channelName - Channel name for the user to search for
 * @returns {getYoutubeUserByName} User data object or null on failure
 */
export async function getYoutubeUserByName(channelName) {
  if (!channelName || typeof channelName !== 'string') {
    Logger.error('Invalid channel name provided');
    return null;
  }
  try {
    const url = `https://www.youtube.com/${normalizeChannelName(channelName)}`;

    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();

    // Extract initial data from the page
    // YouTube embeds channel data in a script tag
    let match = html.match(/var\s+ytInitialData\s*=\s*({.+?});/s);

    if (!match) return null;

    const jsonStr = match[1];
    const data = JSON.parse(jsonStr);

    // Extract channel header data
    const channelData = extractChannelData(data);
    if (channelData) {
      return channelData;
    }

    Logger.warn(`Channel not found for name: ${channelName}`);
    return null;
  } catch (error) {
    Logger.error(`Error fetching YouTube channel: ${error.message}`);
    return null;
  }
}

/**
 *
 * @param {string} message - The message to send in the live stream chat
 * @param {string} accountType - The account type (broadcaster or bot) to use for sending the message
 * @param {{ livestreamId?: string | null }} options - Optional routing context for the target livestream
 * @returns {Promise<{success: boolean, error?: string}>} Result of the message sending operation
 */
export async function sendChatMessage(message, accountType = 'broadcaster', options = {}) {
  try {
    const youtubeConfig = youtubeAccountsConfig.get('');
    const channelId = youtubeConfig?.broadcaster?.id;
    const livestreamId = options?.livestreamId || null;

    if (!channelId) {
      Logger.error('No broadcaster channel ID found, cannot send YouTube message');
      return { success: false, error: 'No broadcaster channel ID found' };
    }

    const connectedLiveChat = getCurrentLiveChatInstance(livestreamId);

    if (connectedLiveChat?.running) {
      await connectedLiveChat.sendMessage(message);
      Logger.log('Message sent successfully');
      return { success: true };
    }

    return await withYoutubeRetry(accountType, 'send chat message', async (yt) => {
      const liveStreamId =
        livestreamId ||
        (await getActiveLivestreamId(yt, channelId)) ||
        getCachedActiveLivestreamId();

      if (!liveStreamId) {
        Logger.warn('No active livestream found for channel');
        return { success: false, error: 'No active livestream' };
      }

      const response = await yt.getInfo(liveStreamId);
      const liveChat = response.getLiveChat();

      if (!liveChat) {
        Logger.warn('No active livestream found for channel');
        return { success: false, error: 'No active livestream' };
      }

      await liveChat.sendMessage(message);
      Logger.log('Message sent successfully');
      return { success: true };
    });
  } catch (error) {
    if (isYoutubeReauthRequiredError(error)) {
      Logger.error(`YouTube chat message requires re-authentication: ${error.message}`);
      return { success: false, error: error.message };
    }

    Logger.error(`Error sending YouTube chat message: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function getLiveStreamInfo() {
  try {
    const youtubeConfig = youtubeAccountsConfig.get('');
    const resolvedChannelId = youtubeConfig?.broadcaster?.id;

    if (!resolvedChannelId) {
      Logger.error('No broadcaster channel ID found, cannot fetch YouTube livestream info');
      return null;
    }

    return await withYoutubeRetry('broadcaster', 'get livestream info', async (yt) => {
      const liveStreamId =
        (await getActiveLivestreamId(yt, resolvedChannelId)) || getCachedActiveLivestreamId();

      if (!liveStreamId) {
        Logger.warn('No active livestream found for channel');
        return null;
      }

      const response = await yt.getInfo(liveStreamId);
      const basicInfo = response?.basic_info || {};
      const liveChat = response?.getLiveChat?.();
      const thumbnails = Array.isArray(basicInfo?.thumbnail)
        ? basicInfo.thumbnail.map((thumbnail) => thumbnail?.url).filter(Boolean)
        : [];

      const returnData = {
        platform: 'youtube',
        channel_id: basicInfo?.channel_id || resolvedChannelId,
        title: basicInfo?.title || '',
        directory: basicInfo?.category || '',
        directory_thumbnail: '',
        id: liveStreamId,
        description: basicInfo?.short_description || basicInfo?.description || '',
        channelName: basicInfo?.author || '',
        url: basicInfo?.url_canonical || `https://www.youtube.com/watch?v=${liveStreamId}`,
        thumbnails,
        viewCount: basicInfo?.view_count || null,
        isLive: Boolean(basicInfo?.is_live),
        isUpcoming: Boolean(basicInfo?.is_upcoming),
        startTimestamp: basicInfo?.start_timestamp || null,
        endTimestamp: basicInfo?.end_timestamp || null,
        duration: basicInfo?.duration || null,
        liveChatAvailable: Boolean(liveChat)
      };

      return returnData;
    });
  } catch (error) {
    if (isYoutubeReauthRequiredError(error)) {
      Logger.error(`YouTube livestream info requires re-authentication: ${error.message}`);
      return null;
    }

    Logger.error(`Error fetching YouTube livestream info: ${error.message}`);
    return null;
  }
}
