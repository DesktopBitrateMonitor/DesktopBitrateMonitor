import { injectDefaults } from '../../../store/defaults';

/**
 *
 * @param {object} event - The event object from the EventSub subscription
 * @param {string} requiredRole - The required role to check ('broadcaster', 'admin', 'mod', 'user')
 * @returns true or false based on whether the user has the required permissions
 */

export const hasPermission = ({ event, requiredRole, restricted }) => {
  const { broadcaster_user_id, chatter_user_id, user_type, badges } = event;
  const { twitchAccountsConfig } = injectDefaults();

  const isBroadcaster = broadcaster_user_id === chatter_user_id;
  const admins = twitchAccountsConfig.get('admins').map((admin) => admin.login);
  const mods = twitchAccountsConfig.get('mods').map((mod) => mod.login);

  const isAdmin = admins.includes(event.chatter_user_login.toLowerCase());
  const isMod =
    mods.includes(event.chatter_user_login.toLowerCase()) ||
    (badges.length > 0 &&
      badges.some((badge) => badge.set_id === 'moderator' || badge.set_id === 'lead_moderator'));

  // If the command is restricted, only allow broadcaster and admins to execute it
  if (restricted) return isBroadcaster || isAdmin;
  // Broadcaster has all permissions, always return true
  if (isBroadcaster) return true;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return isAdmin;
  if (requiredRole === 'mod') return isAdmin || isMod;
  return false;
};
