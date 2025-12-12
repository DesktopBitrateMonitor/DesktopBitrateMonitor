import generateId from '../../lib/id-generator';

export const modCommands = [
  {
    id: generateId(),
    action: 'switchScene',
    requiredRole: 'mod',
    label: 'Switch Scene',
    description:
      'Allows to switch to any scene in the streaming software. If restricted, mods can NOT switch to the live scene, Admins can switch to any scene.',
    cmd: ['!switch', '!ss'],
    enabled: true,
    restricted: true // if true, moderators can not switch to live scene from any other scene
  },
  {
    id: generateId(),
    action: 'refreshStream',
    requiredRole: 'mod',
    label: 'Refresh Stream',
    description: 'Refreshes the stream connection.',
    cmd: ['!refresh', '!fix'],
    enabled: true,
    restricted: false
  },
  {
    id: generateId(),
    action: 'setTrigger',
    requiredRole: 'mod',
    label: 'Set Trigger',
    description: 'Sets a new bitrate trigger point.',
    cmd: ['!settrigger', '!trigger'],
    enabled: true,
    restricted: false
  },
  {
    id: generateId(),
    action: 'setRTrigger',
    label: 'Set Return Trigger',
    requiredRole: 'mod',
    description: 'Sets a new bitrate return point.',
    cmd: ['!rtrigger'],
    enabled: true,
    restricted: false
  }
];
