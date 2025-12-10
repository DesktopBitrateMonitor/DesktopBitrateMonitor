export const messages = {
  global: {
    error: {
      enabled: true,
      message: 'Somthing went wrong! Please try again.'
    }
  },
  stream: {
    started: {
      enabled: true,
      message: 'Stream started successfully!'
    },
    ended: {
      enabled: true,
      message: 'Stream has ended. Thanks for watching!'
    },
    raid: {
      enabled: true,
      message: 'Follow us to twitch.tv/${channel} for more content!'
    },
    refreshTry: {
      enabled: true,
      message: 'Try to refresh the stream!'
    },
    refreshSuccess: {
      enabled: true,
      message: 'Stream refreshed successfully!'
    },
    bitrate: {
      enabled: true,
      message: 'Current bitrate is ${bitrate} kbps.'
    }
  },
  switcher: {
    switch: {
      enabled: true,
      message: 'Switched to scene: ${scene}!'
    },
    trigger: {
      enabled: true,
      message: 'Bitrate trigger set to ${bitrate} kbps!'
    },
    rTrigger: {
      enabled: true,
      message: 'Bitrate return trigger set to ${bitrate} kbps!'
    }
  },
  user: {
    addAdmin: {
      enabled: true,
      message: 'User ${user} has been added as an admin.'
    },
    removeAdmin: {
      enabled: true,
      message: 'User ${user} has been removed from admins.'
    },
    alreadyAdmin: {
      enabled: true,
      message: 'User ${user} is already an admin.'
    },
    addMod: {
      enabled: true,
      message: 'User ${user} has been added as a moderator.'
    },
    removeMod: {
      enabled: true,
      message: 'User ${user} has been removed from moderators.'
    },
    alreadyMod: {
      enabled: true,
      message: 'User ${user} is already a moderator.'
    }
  }
};
