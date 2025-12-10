export const getEventTypes = (broadcaster, bot) => [
  {
    type: 'channel.raid',
    version: '1',
    condition: {
      from_broadcaster_user_id: `${broadcaster.id}`
    }
  },
  {
    type: 'channel.chat.message',
    version: '1',
    condition: {
      broadcaster_user_id: `${broadcaster.id}`,
      user_id: `${bot.id}`
    }
  }
];
