import generateId from '../../lib/id-generator';

export const modCommands = [
  {
    id: generateId(),
    action: 'switchScene',
    requiredRole: 'mod',
    label: 'Switch Scene',
    description:
      'Allows to switch to any scene in the streaming software. If restricted, only the broadcaster and Admins can switch to the live scene.',
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
    enabled: true
  },
  {
    id: generateId(),
    action: 'setTrigger',
    requiredRole: 'mod',
    label: 'Set Trigger',
    description: 'Sets a new bitrate trigger point.',
    cmd: ['!settrigger', '!trigger'],
    enabled: true
  },
  {
    id: generateId(),
    action: 'setRTrigger',
    label: 'Set Return Trigger',
    requiredRole: 'mod',
    description: 'Sets a new bitrate return point.',
    cmd: ['!rtrigger'],
    enabled: true
  }
];
