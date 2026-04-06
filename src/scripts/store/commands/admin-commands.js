import generateId from '../../lib/id-generator';

export const adminCommands = [
  {
    id: generateId(),
    action: 'startStream',
    requiredRole: 'broadcaster',
    label: 'Start Stream',
    description: 'Starts the stream.',
    cmd: ['!start'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'stopStream',
    requiredRole: 'broadcaster',
    label: 'Stop Stream',
    description: 'Stops the stream.',
    cmd: ['!stop'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'addAdmin',
    requiredRole: 'broadcaster',
    label: 'Add Admin',
    description: 'Adds a new admin.',
    cmd: ['!addadmin'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'removeAdmin',
    requiredRole: 'broadcaster',
    label: 'Remove Admin',
    description: 'Removes an admin.',
    cmd: ['!removeadmin'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'switchToLive',
    requiredRole: 'admin',
    label: 'Switch to Live Scene',
    cmd:['!live'],
    description: 'Switches to the live scene.',
    enabled: true
  },
  {
    id: generateId(),
    action: 'switchToLow',
    requiredRole: 'admin',
    label: 'Switch to Low Scene',
    cmd:['!low'],
    description: 'Switches to the Low scene.',
    enabled: true
  },
  {
    id: generateId(),
    action: 'switchToOffline',
    requiredRole: 'admin',
    label: 'Switch to Offline Scene',
    cmd:['!offline'],
    description: 'Switches to the offline scene.',
    enabled: true
  },
  {
    id: generateId(),
    action: 'switchToPrivacy',
    requiredRole: 'admin',
    label: 'Switch to Privacy Scene',
    cmd:['!privacy'],
    description: 'Switches to the privacy scene.',
    enabled: true
  },
  {
    id: generateId(),
    action: 'switchToStart',
    requiredRole: 'admin',
    label: 'Switch to Start Scene',
    cmd:['!intro'],
    description: 'Switches to the start scene.',
    enabled: true
  },
  {
    id: generateId(),
    action: 'addMod',
    requiredRole: 'admin',
    label: 'Add Mod',
    description: 'Adds a new moderator.',
    cmd: ['!addmod'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'removeMod',
    requiredRole: 'admin',
    label: 'Remove Mod',
    description: 'Removes a moderator.',
    cmd: ['!removemod'],
    enabled: true
  }
];
