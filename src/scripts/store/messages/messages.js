export const messages = {
  global: [
    {
      event: 'error',
      enabled: true,
      message: 'Somthing went wrong! Please try again.'
    }
  ],
  stream: [
    {
      event: 'started',
      enabled: true,
      message: 'Stream started successfully!'
    },
    {
      event: 'ended',
      enabled: true,
      message: 'Stream has ended. Thanks for watching!'
    },
    {
      event: 'raid',
      enabled: true,
      message: 'Follow us to twitch.tv/${channel} for more content!'
    },
    {
      event: 'refreshTry',
      enabled: true,
      message: 'Try to refresh the stream!'
    },
    {
      event: 'refreshSuccess',
      enabled: true,
      message: 'Stream refreshed successfully!'
    },
    {
      event: 'bitrate',
      enabled: true,
      message: 'Current bitrate is ${bitrate} kbps.'
    }
  ],
  switcher: [
    {
      event: 'switch',
      enabled: true,
      message: 'Switched to scene: ${scene}!'
    },
    {
      event: 'trigger',
      enabled: true,
      message: 'Bitrate trigger set to ${bitrate} kbps!'
    },
    {
      event: 'rTrigger',
      enabled: true,
      message: 'Bitrate return trigger set to ${bitrate} kbps!'
    }
  ],
  user: [
    {
      event: 'addAdmin',
      enabled: true,
      message: 'User ${user} has been added as an admin.'
    },
    {
      event: 'removeAdmin',
      enabled: true,
      message: 'User ${user} has been removed from admins.'
    },
    {
      event: 'alreadyAdmin',
      enabled: true,
      message: 'User ${user} is already an admin.'
    },
    {
      event: 'addMod',
      enabled: true,
      message: 'User ${user} has been added as a moderator.'
    },
    {
      event: 'removeMod',
      enabled: true,
      message: 'User ${user} has been removed from moderators.'
    },
    {
      event: 'alreadyMod',
      enabled: true,
      message: 'User ${user} is already a moderator.'
    }
  ]
};
