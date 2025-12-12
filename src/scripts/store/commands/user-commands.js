import generateId from '../../lib/id-generator';

export const userCommands = [
  {
    id: generateId(),
    action: 'bitrate',
    requiredRole: 'user',
    label: 'Show Bitrate',
    description: 'Displays the current bitrate of the stream.',
    cmd: ['!bitrate', '!b'],
    enabled: true,
    restricted: false
  }
];
