import { injectDefaults } from '../../../store/defaults';

/**
 *
 * @param {object} event - The chat message event object from the YouTube API
 * @param {string} requiredRole - The required role to check ('broadcaster', 'admin', 'mod', 'user')
 * @param {boolean} restricted - Whether the command is restricted
 * @param {boolean} inPrivacyScene - Whether the current scene is the privacy scene
 * @returns {boolean} - Whether the user has the required permissions
 */

const { youtubeAccountsConfig } = injectDefaults();
export const hasPermission = ({ event, requiredRole, restricted, inPrivacyScene }) => {
  const role = getYoutubeUserRole({ event });

  const isBroadcaster = role === 'broadcaster';
  const isModerator = role === 'mod';
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

export const getYoutubeUserRole = ({ event }) => {
  const broadcasterId = youtubeAccountsConfig.get('broadcaster.id');

  const isBroadcaster = event.item.author.id === broadcasterId;
  const admins = youtubeAccountsConfig.get('admins').map((admin) => admin.login.toLowerCase());
  const mods = youtubeAccountsConfig.get('mods').map((mod) => mod.login.toLowerCase());

  const displayName = event?.item?.author?.name.toLowerCase();
  const normalizedDisplayName = normalizeDisplayName(displayName);

  const isAdmin = admins.includes(normalizedDisplayName);
  const isMod = mods.includes(normalizedDisplayName) || event.item.author.isChatModerator;

  if (isBroadcaster) return 'broadcaster';
  if (isAdmin) return 'admin';
  if (isMod) return 'mod';
  return 'user';
};

const normalizeDisplayName = (displayName) => {
  return !displayName.startsWith('@') ? `@${displayName.toLowerCase()}` : displayName.toLowerCase();
};
