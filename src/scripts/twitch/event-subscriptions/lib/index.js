import { injectDefaults } from '../../../store/defaults';

/**
 *
 * @param {object} event - The chat message event object from the YouTube API
 * @param {string} requiredRole - The required role to check ('broadcaster', 'admin', 'mod', 'user')
 * @param {boolean} restricted - Whether the command is restricted
 * @param {boolean} inPrivacyScene - Whether the current scene is the privacy scene
 * @returns {boolean} - Whether the user has the required permissions
 */

const { twitchAccountsConfig } = injectDefaults();

export const hasPermission = ({ event, requiredRole, restricted, inPrivacyScene }) => {
  const role = getTwitchUserRole({ event });

  const isBroadcaster = role === 'broadcaster';
  const isAdmin = role === 'admin';
  const isMod = role === 'mod';

  // If the command is restricted and the current scene is the privacy scene, only allow broadcaster and admins to execute it
  if (restricted && inPrivacyScene) return isBroadcaster || isAdmin;
  // Broadcaster has all permissions, always return true
  if (isBroadcaster) return true;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return isAdmin;
  if (requiredRole === 'mod') return isAdmin || isMod;
  return false;
};

export const getTwitchUserRole = ({ event }) => {
  const { broadcaster_user_id, chatter_user_id, user_type, badges } = event;

  const isBroadcaster = broadcaster_user_id === chatter_user_id;
  const admins = twitchAccountsConfig.get('admins').map((admin) => admin.login);
  const mods = twitchAccountsConfig.get('mods').map((mod) => mod.login);

  const isAdmin = admins.includes(event.chatter_user_login.toLowerCase());
  const isMod =
    mods.includes(event.chatter_user_login.toLowerCase()) ||
    (badges.length > 0 &&
      badges.some((badge) => badge.set_id === 'moderator' || badge.set_id === 'lead_moderator'));

  if (isBroadcaster) return 'broadcaster';
  if (isAdmin) return 'admin';
  if (isMod) return 'mod';
  return 'user';
};
