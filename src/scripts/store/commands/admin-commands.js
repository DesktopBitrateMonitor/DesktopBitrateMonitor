import generateId from '../../lib/id-generator';

export const adminCommands = [
  {
    id: generateId(),
    action: 'startStream',
    requiredRole: 'admin',
    label: 'Start Stream',
    description: 'Starts the stream.',
    cmd: ['!start'],
    enabled: true,
    restricted: false // if true, only the broadcaster can start the stream
  },
  {
    id: generateId(),
    action: 'stopStream',
    requiredRole: 'admin',    description: 'Stops the stream.',
    label: 'Stop Stream',
    description: 'Stops the stream.',
    cmd: ['!stop'],
    enabled: true,
    restricted: false // if true, only the broadcaster can stop the stream
  },
  {
    id: generateId(),
    action: 'addAdmin',
    requiredRole: 'admin',
    label: 'Add Admin',
    description: 'Adds a new admin.',
    cmd: ['!addadmin'],
    enabled: true,
    restricted: false // if true, only the broadcaster can add new admins
  },
  {
    id: generateId(),
    action: 'removeAdmin',
    requiredRole: 'admin',
    label: 'Remove Admin',
    description: 'Removes an admin.',
    cmd: ['!removeadmin'],
    enabled: true,
    restricted: false // if true, only the broadcaster can remove admins
  },
  {
    id: generateId(),
    action: 'addMod',
    requiredRole: 'admin',
    label: 'Add Mod',
    description: 'Adds a new moderator.',
    cmd: ['!addmod'],
    enabled: true,
    restricted: false // if true, only the broadcaster can add new moderators
  },
  {
    id: generateId(),
    action: 'removeMod',
    requiredRole: 'admin',
    label: 'Remove Mod',
    description: 'Removes a moderator.',
    cmd: ['!removemod'],
    enabled: true,
    restricted: false // if true, only the broadcaster can remove moderators
  }
];
