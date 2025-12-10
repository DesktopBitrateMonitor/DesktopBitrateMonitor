import generateId from '../../lib/id-generator';

export const userCommands = {
  bitrate: {
    id: generateId(),
    requiredRole: 'user',
    description: 'Displays the current bitrate of the stream.',
    cmd: ['!bitrate', '!b'],
    enabled: true,
    restricted: false
  }
};
