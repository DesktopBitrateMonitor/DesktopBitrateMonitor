import generateId from '../../lib/id-generator';

export const modCommands = {
  switchScene: {
    id: generateId(),
    requiredRole: 'mod',
    description:
      'Allows to switch to any scene in the streaming software. If restricted, mods can NOT switch to the live scene, Admins can switch to any scene.',
    cmd: ['!switch', '!ss'],
    enabled: true,
    restricted: true // if true, moderators can not switch to live scene from any other scene
  },
  refreshStream: {
    id: generateId(),
    requiredRole: 'mod',
    description: 'Refreshes the stream connection.',
    cmd: ['!refresh', '!fix'],
    enabled: true,
    restricted: false
  },
  setTrigger: {
    id: generateId(),
    requiredRole: 'mod',
    description: 'Sets a new bitrate trigger point.',
    cmd: ['!settrigger', '!trigger'],
    enabled: true,
    restricted: false
  },
  rTrigger: {
    id: generateId(),
    requiredRole: 'mod',
    description: 'Sets a new bitrate return point.',
    cmd: ['!rtrigger'],
    enabled: true,
    restricted: false
  }
};