import { injectDefaults } from '../../../store/defaults';

/**
 *
 * @param {object} event - The chat message event object from the YouTube API
 * @param {string} requiredRole - The required role to check ('broadcaster', 'admin', 'mod', 'user')
 * @param {boolean} restricted - Whether the command is restricted
 * @param {boolean} inPrivacyScene - Whether the current scene is the privacy scene
 * @returns {boolean} - Whether the user has the required permissions
 */

export const hasPermission = ({ event, requiredRole, restricted, inPrivacyScene }) => {
  const { twitchAccountsConfig } = injectDefaults();

  const isBroadcaster = event.authorDetails.isChatOwner;
  const admins = twitchAccountsConfig.get('admins').map((admin) => admin.login.toLowerCase());
  const mods = twitchAccountsConfig.get('mods').map((mod) => mod.login.toLowerCase());

  const displayName = event.authorDetails.displayName;
  const normalizedDisplayName = normalizeDisplayName(displayName);

  const isAdmin = admins.includes(normalizedDisplayName);
  const isMod = mods.includes(normalizedDisplayName) || event.authorDetails.isChatModerator;

  // If the command is restricted and the current scene is the privacy scene, only allow broadcaster and admins to execute it
  if (restricted && inPrivacyScene) return isBroadcaster || isAdmin;
  // Broadcaster has all permissions, always return true
  if (isBroadcaster) return true;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return isAdmin;
  if (requiredRole === 'mod') return isAdmin || isMod;
  return false;
};

const normalizeDisplayName = (displayName) => {
  return !displayName.startsWith('@') ? `@${displayName.toLowerCase()}` : displayName.toLowerCase();
};
