import generateId from '../../lib/id-generator';

export const messages = [
  {
    id: generateId(),
    group: 'global',
    action: 'global',
    event: 'success',
    enabled: true,
    label: 'Global Success Message',
    message: 'Operation completed successfully!',
    hint: null
  },
  {
    id: generateId(),
    group: 'global',
    action: 'global',
    event: 'error',
    enabled: true,
    label: 'Global Error Message',
    message: 'Something went wrong! Please try again.',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'startStream',
    event: 'success',
    enabled: true,
    label: 'Stream Started Message',
    message: 'Stream started successfully!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'startStream',
    event: 'error',
    enabled: true,
    label: 'Stream Start Failure Message',
    message: 'Failed to start the stream!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'endStream',
    event: 'success',
    enabled: true,
    label: 'Stream Ended Message',
    message: 'Stream has ended. Thanks for watching!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'endStream',
    event: 'error',
    enabled: true,
    label: 'Stream End Failure Message',
    message: 'Failed to end the stream!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'raid',
    event: 'success',
    enabled: true,
    label: 'Raid Success Message',
    message: 'Follow us to twitch.tv/${channel} for more content!',
    hint: '${channel} will be replaced with the raided channel name.'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'raid',
    event: 'error',
    enabled: true,
    label: 'Raid Failure Message',
    message: 'Failed to raid twitch.tv/${channel}!',
    hint: '${channel} will be replaced with the raided channel name.'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'try',
    enabled: true,
    label: 'Refresh Stream Attempt Message',
    message: 'Try to refresh the stream!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'success',
    enabled: true,
    label: 'Refresh Stream Success Message',
    message: 'Stream refreshed successfully!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'refreshStream',
    event: 'error',
    enabled: true,
    label: 'Refresh Stream Failure Message',
    message: 'Failed to refresh the stream!',
    hint: null
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'bitrate',
    event: 'success',
    enabled: true,
    label: 'Bitrate Message',
    message: 'Current bitrate is ${bitrate}|${speed} kbps.',
    hint: '${bitrate} will be replaced with the current bitrate. ${speed} will be replaced with the current transmition speed.'
  },
  {
    id: generateId(),
    group: 'stream',
    action: 'bitrate',
    event: 'error',
    enabled: true,
    label: 'Bitrate Message',
    message: 'Failed to retrieve current bitrate.',
    hint: null
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'switchScene',
    event: 'success',
    enabled: true,
    label: 'Switch Scene Message',
    message: 'Switched to scene: ${scene}!',
    hint: '${scene} will be replaced with the switched scene name.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'switchScene',
    event: 'error',
    enabled: true,
    label: 'Switch Scene Failure Message',
    message: 'Failed to switch to scene: ${scene}!',
    hint: '${scene} will be replaced with the switched scene name.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'setTrigger',
    event: 'success',
    enabled: true,
    label: 'Bitrate Trigger Success Message',
    message: 'Bitrate trigger set to ${trigger} kbps!',
    hint: '${trigger} will be replaced with the set trigger value.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'setTrigger',
    event: 'error',
    enabled: true,
    label: 'Bitrate Trigger Error Message',
    message: ' Failed to set bitrate trigger to ${trigger} kbps!',
    hint: '${trigger} will be replaced with the set trigger value.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'setRTrigger',
    event: 'success',
    enabled: true,
    label: 'Bitrate Return Trigger Success Message',
    message: 'Bitrate return trigger set to ${rtrigger} kbps!',
    hint: '${rtrigger} will be replaced with the set return trigger value.'
  },
  {
    id: generateId(),
    group: 'switcher',
    action: 'setRTrigger',
    event: 'error',
    enabled: true,
    label: 'Bitrate Return Trigger Error Message',
    message: 'Failed to set bitrate return trigger to ${rtrigger} kbps!',
    hint: '${rtrigger} will be replaced with the set return trigger value.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'addAdmin',
    event: 'success',
    enabled: true,
    label: 'Add Admin Message',
    message: 'User ${user} has been added as an admin.',
    hint: '${user} will be replaced with the added admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'addAdmin',
    event: 'error',
    enabled: true,
    label: 'Add Admin Error Success Message',
    message: 'Failed to add user ${user} as an admin.',
    hint: '${user} will be replaced with the added admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'addAdmin',
    event: 'alreadyAdmin',
    enabled: true,
    label: 'Already Admin Message',
    message: 'User ${user} is already an admin.',
    hint: '${user} will be replaced with the added admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeAdmin',
    event: 'success',
    enabled: true,
    label: 'Remove Admin Success Message',
    message: 'User ${user} has been removed from admins.',
    hint: '${user} will be replaced with the removed admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeAdmin',
    event: 'error',
    enabled: true,
    label: 'Remove Admin Error Message',
    message: 'Failed to remove user ${user} from admins.',
    hint: '${user} will be replaced with the removed admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeAdmin',
    event: 'notFound',
    enabled: true,
    label: 'Admin Not Found Message',
    message: 'No admin found with username ${user}.',
    hint: '${user} will be replaced with the removed admin username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'addMod',
    event: 'success',
    enabled: true,
    label: 'Add Mod Success Message',
    message: 'User ${user} has been added as a moderator.',
    hint: '${user} will be replaced with the added moderator username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'addMod',
    event: 'error',
    enabled: true,
    label: 'Add Mod Error Message',
    message: 'Failed to add user ${user} as a moderator.',
    hint: '${user} will be replaced with the added moderator username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeMod',
    event: 'success',
    enabled: true,
    label: 'Remove Mod Success Message',
    message: 'User ${user} has been removed from moderators.',
    hint: '${user} will be replaced with the removed moderator username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeMod',
    event: 'alreadyMod',
    enabled: true,
    label: 'Already Mod Message',
    message: 'User ${user} is already a moderator.',
    hint: '${user} will be replaced with the removed moderator username.'
  },
  {
    id: generateId(),
    group: 'user',
    action: 'removeMod',
    event: 'notFound',
    enabled: true,
    label: 'Mod Not Found Message',
    message: 'No moderator found with username ${user}.',
    hint: '${user} will be replaced with the removed moderator username.'
  }
];
