import generateId from '../../lib/id-generator';

export const messages = [
  {
    id: generateId(),
    group: 'global',
    event: 'error',
    enabled: true,
    label: 'Error Message',
    message: 'Something went wrong! Please try again.'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'started',
    enabled: true,
    label: 'Stream Started Message',
    message: 'Stream started successfully!'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'ended',
    enabled: true,
    label: 'Stream Ended Message',
    message: 'Stream has ended. Thanks for watching!'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'raid',
    enabled: true,
    label: 'Raid Message',
    message: 'Follow us to twitch.tv/${channel} for more content!'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'refreshTry',
    enabled: true,
    label: 'Refresh Stream Attempt Message',
    message: 'Try to refresh the stream!'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'refreshSuccess',
    enabled: true,
    label: 'Refresh Stream Success Message',
    message: 'Stream refreshed successfully!'
  },
  {
    id: generateId(),
    group: 'stream',
    event: 'bitrate',
    enabled: true,
    label: 'Bitrate Message',
    message: 'Current bitrate is ${bitrate} kbps.'
  },
  {
    id: generateId(),
    group: 'switcher',
    event: 'switch',
    enabled: true,
    label: 'Switch Scene Message',
    message: 'Switched to scene: ${scene}!'
  },
  {
    id: generateId(),
    group: 'switcher',
    event: 'trigger',
    enabled: true,
    label: 'Bitrate Trigger Message',
    message: 'Bitrate trigger set to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'switcher',
    event: 'rTrigger',
    enabled: true,
    label: 'Bitrate Return Trigger Message',
    message: 'Bitrate return trigger set to ${bitrate} kbps!'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'addAdmin',
    enabled: true,
    label: 'Add Admin Message',
    message: 'User ${user} has been added as an admin.'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'removeAdmin',
    enabled: true,
    label: 'Remove Admin Message',
    message: 'User ${user} has been removed from admins.'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'alreadyAdmin',
    enabled: true,
    label: 'Already Admin Message',
    message: 'User ${user} is already an admin.'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'addMod',
    enabled: true,
    label: 'Add Mod Message',
    message: 'User ${user} has been added as a moderator.'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'removeMod',
    enabled: true,
    label: 'Remove Mod Message',
    message: 'User ${user} has been removed from moderators.'
  },
  {
    id: generateId(),
    group: 'user',
    event: 'alreadyMod',
    enabled: true,
    label: 'Already Mod Message',
    message: 'User ${user} is already a moderator.'
  }
];
