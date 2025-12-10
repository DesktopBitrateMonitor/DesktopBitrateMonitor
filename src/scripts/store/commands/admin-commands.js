import generateId from '../../lib/id-generator';

export const adminCommands = {
  startStream: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Starts the stream.',
    cmd: ['!start'],
    enabled: true,
    restricted: false // if true, only the broadcaster can start the stream
  },
  stopStream: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Stops the stream.',
    cmd: ['!stop'],
    enabled: true,
    restricted: false // if true, only the broadcaster can stop the stream
  },
  addAdmin: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Adds a new admin.',
    cmd: ['!addadmin'],
    enabled: true,
    restricted: false // if true, only the broadcaster can add new admins
  },
  removeAdmin: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Removes an admin.',
    cmd: ['!removeadmin'],
    enabled: true,
    restricted: false // if true, only the broadcaster can remove admins
  },
  addMod: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Adds a new moderator.',
    cmd: ['!addmod'],
    enabled: true,
    restricted: false // if true, only the broadcaster can add new moderators
  },
  removeMod: {
    id: generateId(),
    requiredRole: 'admin',
    description: 'Removes a moderator.',
    cmd: ['!removemod'],
    enabled: true,
    restricted: false // if true, only the broadcaster can remove moderators
  }
};
