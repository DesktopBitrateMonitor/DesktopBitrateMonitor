export const getEventTypes = (bc, bot) => [
  {
    type: 'channel.raid',
    version: '1',
    condition: {
      from_broadcaster_user_id: `${bc.id}`
    }
  },
  {
    type: 'channel.chat.message',
    version: '1',
    condition: {
      broadcaster_user_id: `${bc.id}`,
      user_id: `${bc.id}`
    }
  }
];
