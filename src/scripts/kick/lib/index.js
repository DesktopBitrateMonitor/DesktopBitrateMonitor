import { injectDefaults } from '../../store/defaults';

/**
 *
 * @param {Object} event t - The event object from the Kick chat message event
 * @param {string} requiredRole - The required role to check ('broadcaster', 'admin', 'mod', 'user')
 * @param {boolean} restricted - Whether the command is restricted to broadcaster and admins only
 * @returns true or false based on whether the user has the required permissions
 */

export const hasPermission = ({ event, requiredRole, restricted }) => {
  const { badges } = event.sender?.identity || [];

  const { kickAccountsConfig } = injectDefaults();

  const isBroadcaster = badges.length > 0 && badges.some((badge) => badge.type === 'broadcaster');
  const isModerator = badges.length > 0 && badges.some((badge) => badge.type === 'moderator');
  const admins = kickAccountsConfig.get('admins').map((admin) => admin.login.toLowerCase());
  const mods = kickAccountsConfig.get('mods').map((mod) => mod.login.toLowerCase());

  const isAdmin = admins.includes(event.sender?.username?.toLowerCase());
  const isMod = mods.includes(event.sender?.username?.toLowerCase()) || isModerator;

  // If the command is restricted, only allow broadcaster and admins to execute it
  if (restricted) return isBroadcaster || isAdmin;
  // Broadcaster has all permissions, always return true
  if (isBroadcaster) return true;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return isAdmin;
  if (requiredRole === 'mod') return isAdmin || isMod;
  return false;
};

/*


Received Kick chat message event: {id: '2a2b5371-1dbd-4e41-ab8e-40388fe6ec3e', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:19+00:00', …}
arg1: {id: '2a2b5371-1dbd-4e41-ab8e-40388fe6ec3e', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:19+00:00', …}
chatroom_id: 410755
content: 'test'
created_at: '2026-03-16T13:29:19+00:00'
id: '2a2b5371-1dbd-4e41-ab8e-40388fe6ec3e'
metadata: {message_ref: '1773667757027'}
message_ref: '1773667757027'
[[Prototype]]: Object
sender: {id: 420915, username: 'Yinks', slug: 'yinks', identity: {…}}
id: 420915
identity: {color: '#31D6C2', badges: Array(1)}
badges: (1) [{…}]
0: {type: 'broadcaster', text: 'Broadcaster'}
length: 1
[[Prototype]]: Array(0)
[[Prototype]]: Object
color: '#31D6C2'
[[Prototype]]: Object
slug: 'yinks'
username: 'Yinks'
[[Prototype]]: Object
type: 'message'
[[Prototype]]: Object


Received Kick chat message event: {id: '0fed43fc-6928-418a-9297-2a661204bb90', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:29+00:00', …}
arg1: {id: '0fed43fc-6928-418a-9297-2a661204bb90', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:29+00:00', …}
chatroom_id: 410755
content: 'test'
created_at: '2026-03-16T13:29:29+00:00'
id: '0fed43fc-6928-418a-9297-2a661204bb90'
metadata: {message_ref: '1773667767210'}
message_ref: '1773667767210'
[[Prototype]]: Object
sender: {id: 99550823, username: 'DesktopBitrateMonitor', slug: 'desktopbitratemonitor', identity: {…}}
id: 99550823
identity: {color: '#BAFEA3', badges: Array(1)}
badges: (1) [{…}]
0: {type: 'moderator', text: 'Moderator'}
length: 1
[[Prototype]]: Array(0)
[[Prototype]]: Object
color: '#BAFEA3'
[[Prototype]]: Object
slug: 'desktopbitratemonitor'
username: 'DesktopBitrateMonitor'
[[Prototype]]: Object
type: 'message'
[[Prototype]]: Object


Received Kick chat message event: {id: 'cf478ea1-c47f-4b33-a0af-f4865ed1106b', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:40+00:00', …}
arg1: {id: 'cf478ea1-c47f-4b33-a0af-f4865ed1106b', chatroom_id: 410755, content: 'test', type: 'message', created_at: '2026-03-16T13:29:40+00:00', …}
chatroom_id: 410755
content: 'test'
created_at: '2026-03-16T13:29:40+00:00'
id: 'cf478ea1-c47f-4b33-a0af-f4865ed1106b'
metadata: {message_ref: '1773667777548'}
message_ref: '1773667777548'
[[Prototype]]: Object
sender: {id: 99550823, username: 'DesktopBitrateMonitor', slug: 'desktopbitratemonitor', identity: {…}}
id: 99550823
identity: {color: '#BAFEA3', badges: Array(0)}
badges: (0) []
length: 0
[[Prototype]]: Array(0)
[[Prototype]]: Object
color: '#BAFEA3'
[[Prototype]]: Object
slug: 'desktopbitratemonitor'
username: 'DesktopBitrateMonitor'
[[Prototype]]: Object
type: 'message'
[[Prototype]]: Object

 */
