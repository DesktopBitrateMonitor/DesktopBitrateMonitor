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
    requiredRole: 'admin',
    label: 'Add Admin',
    description: 'Adds a new admin.',
    cmd: ['!addadmin'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'removeAdmin',
    requiredRole: 'admin',
    label: 'Remove Admin',
    description: 'Removes an admin.',
    cmd: ['!removeadmin'],
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
