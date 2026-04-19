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
    restricted: true, // if true, moderators can not switch to live scene from any other scene
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  },
  {
    id: generateId(),
    action: 'refreshStream',
    requiredRole: 'mod',
    label: 'Refresh Stream',
    description: 'Refreshes the stream connection.',
    cmd: ['!refresh', '!fix'],
    enabled: true,
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  },
  {
    id: generateId(),
    action: 'setTrigger',
    requiredRole: 'mod',
    label: 'Set Trigger',
    description: 'Sets a new bitrate trigger point.',
    cmd: ['!settrigger', '!trigger'],
    enabled: true,
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  },
  {
    id: generateId(),
    action: 'setRTrigger',
    label: 'Set Return Trigger',
    requiredRole: 'mod',
    description: 'Sets a new bitrate return point.',
    cmd: ['!rtrigger'],
    enabled: true,
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  },
  {
    id: generateId(),
    action: 'addAlias',
    label: 'Add Command Alias',
    requiredRole: 'mod',
    description:
      'Adds a new alias to an existing command. Usage: !addalias [existing command] [new alias]',
    cmd: ['!addalias'],
    enabled: true,
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  },
  {
    id: generateId(),
    action: 'removeAlias',
    label: 'Remove Command Alias',
    requiredRole: 'mod',
    description:
      'Removes an existing alias from a command. Usage: !removealias [existing command] [alias]',
    cmd: ['!removealias'],
    enabled: true,
    coolDowns: {
      all: 0,
      mod: 0,
      user: 5
    }
  }
];
