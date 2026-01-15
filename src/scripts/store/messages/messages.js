import generateId from '../../lib/id-generator';

export const messages = [
  {
    id: generateId(),
    group: 'global',
    action: 'global',
    event: 'success',
    enabled: true,
    label: 'Global Success Message',
    message: 'Operation completed successfully!'
  },
  {
    id: generateId(),
    group: 'global',
    action: 'global',
    event: 'error',
    enabled: true,
    label: 'Global Error Message',
    message: 'Something went wrong! Please try again.'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'startStream',
    event: 'success',
    enabled: true,
    label: 'Stream Started Message',
    message: 'Stream started successfully!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'startStream',
    event: 'error',
    enabled: true,
    label: 'Stream Start Failure Message',
    message: 'Failed to start the stream!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'endStream',
    event: 'success',
    enabled: true,
    label: 'Stream Ended Message',
    message: 'Stream has ended. Thanks for watching!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'endStream',
    event: 'error',
    enabled: true,
    label: 'Stream End Failure Message',
    message: 'Failed to end the stream!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'raid',
    event: 'success',
    enabled: true,
    label: 'Raid Success Message',
    message: 'Follow us to twitch.tv/${channel} for more content!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'raid',
    event: 'error',
    enabled: true,
    label: 'Raid Failure Message',
    message: 'Failed to raid twitch.tv/${channel}!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'try',
    enabled: true,
    label: 'Refresh Stream Attempt Message',
    message: 'Try to refresh the stream!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'success',
    enabled: true,
    label: 'Refresh Stream Success Message',
    message: 'Stream refreshed successfully!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'error',
    enabled: true,
    label: 'Refresh Stream Failure Message',
    message: 'Failed to refresh the stream!'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'bitrate',
    event: 'success',
    enabled: true,
    label: 'Bitrate Message',
    message: 'Current bitrate is ${bitrate} kbps.'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'bitrate',
    event: 'error',
    enabled: true,
    label: 'Bitrate Message',
    message: 'Failed to retrieve current bitrate.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'switchScene',
    event: 'success',
    enabled: true,
    label: 'Switch Scene Message',
    message: 'Switched to scene: ${scene}!'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'switchScene',
    event: 'error',
    enabled: true,
    label: 'Switch Scene Failure Message',
    message: 'Failed to switch to scene: ${scene}!'
  },
  {
    id: generateId(),
    group: 'switcher',
    action:'setTrigger',
    event: 'success',
    enabled: true,
    label: 'Bitrate Trigger Success Message',
    message: 'Bitrate trigger set to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'switcher',
    action:'setTrigger',
    event: 'error',
    enabled: true,
    label: 'Bitrate Trigger Error Message',
    message: ' Failed to set bitrate trigger to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'switcher',
    action:'setRTrigger',
    event: 'success',
    enabled: true,
    label: 'Bitrate Return Trigger Success Message',
    message: 'Bitrate return trigger set to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'switcher',
    action:'setRTrigger',
    event: 'error',
    enabled: true,
    label: 'Bitrate Return Trigger Error Message',
    message: 'Failed to set bitrate return trigger to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'user',
    action:'addAdmin',
    event: 'success',
    enabled: true,
    label: 'Add Admin Message',
    message: 'User ${user} has been added as an admin.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'addAdmin',
    event: 'error',
    enabled: true,
    label: 'Add Admin Error Success Message',
    message: 'Failed to add user ${user} as an admin.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'addAdmin',
    event: 'alreadyAdmin',
    enabled: true,
    label: 'Already Admin Message',
    message: 'User ${user} is already an admin.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeAdmin',
    event: 'success',
    enabled: true,
    label: 'Remove Admin Success Message',
    message: 'User ${user} has been removed from admins.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeAdmin',
    event: 'error',
    enabled: true,
    label: 'Remove Admin Error Message',
    message: 'Failed to remove user ${user} from admins.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeAdmin',
    event: 'notFound',
    enabled: true,
    label: 'Admin Not Found Message',
    message: 'No admin found with username ${user}.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'addMod',
    event: 'success',
    enabled: true,
    label: 'Add Mod Success Message',
    message: 'User ${user} has been added as a moderator.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'addMod',
    event: 'error',
    enabled: true,
    label: 'Add Mod Error Message',
    message: 'Failed to add user ${user} as a moderator.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeMod',
    event: 'success',
    enabled: true,
    label: 'Remove Mod Success Message',
    message: 'User ${user} has been removed from moderators.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeMod',
    event: 'alreadyMod',
    enabled: true,
    label: 'Already Mod Message',
    message: 'User ${user} is already a moderator.'
  },
  {
    id: generateId(),
    group: 'user',
    action:'removeMod',
    event: 'notFound',
    enabled: true,
    label: 'Mod Not Found Message',
    message: 'No moderator found with username ${user}.'
  }
];
