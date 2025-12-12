import { adminCommands } from './commands/admin-commands';
import { modCommands } from './commands/mod-commands';
import { userCommands } from './commands/user-commands';
import { messages } from './messages/messages';
import Store from './store';

/**
 * Inject default values into the store.
 * @returns {Object} The store with default values.
 */

export const injectDefaults = () => {
  // Default configuration for the application with default values
  const appConfig = new Store({
    name: 'app-config',
    defaults: {
      theme: 'dark',
      language: 'en',
      layout: {
        dashboard: {
          sidebar: {
            open: true
          }
        },
        settings: null
      },
      position: {
        x: null,
        y: null
      },
      size: {
        width: 1200,
        height: 800
      },
      screen: {
        id: null
      },
      onQuit: 'quit'
    }
  });

  const loggingConfig = new Store({
    name: 'logging-config',
    defaults: {
      feedLogs: true,
      feedLogsPath: '',
      actionLogs: true,
      actionLogsPath: ''
    }
  });

  const channelConfig = new Store({
    name: 'channel-config',
    defaults: {
      channel: {
        id: '',
        login: '',
        display_name: '',
        access_token: '',
        refresh_token: '',
        scopes: [],
        profile_image_url: ''
      },
      admins: [],
      mods: []
    }
  });

  const commandsConfig = new Store({
    name: 'commands-config',
    defaults: {
      commands: [...adminCommands, ...modCommands, ...userCommands]
    }
  });

  const messagesConfig = new Store({
    name: 'messages-config',
    defaults: messages
  });

  const chatbotConfig = new Store({
    name: 'chatbot-config',
    defaults: {
      id: '',
      login: '',
      display_name: '',
      access_token: '',
      refresh_token: '',
      scopes: [],
      profile_image_url: ''
    }
  });

  const serverConfig = new Store({
    name: 'server-config',
    defaults: {
      host: '',
      streamId: '',
      provider: ''
    }
  });

  const streamingSoftwareConfig = new Store({
    name: 'streaming-software-config',
    defaults: {
      software: 'obs',
      host: 'localhost',
      port: 4455,
      password: ''
    }
  });

  const switcherConfig = new Store({
    name: 'switcher-config',
    defaults: {
      trigger: 400,
      rTrigger: 1200,
      triggerOffline: 0,
      switchTimeout: {
        toLive: 3,
        toLow: 3,
        toOffline: 3
      },
      sceneLive: 'LIVE',
      sceneLow: 'FALLBACK',
      sceneOffline: 'OFFLINE',
      scenePrivacy: 'PRIVACY',
      sceneStart: 'INTRO',
      switcherEnabled: true
    }
  });

  // Define more default storage instances here to return the defaults

  // const secondConfig = new Store({
  //   name: 'second-config',
  //   defaults: {
  //     key: {
  //       value_1: 'default_value_1',
  //       value_2: 'default_value_2'
  //     }
  //   }
  // });

  return {
    appConfig,
    loggingConfig,
    channelConfig,
    commandsConfig,
    messagesConfig,
    chatbotConfig,
    serverConfig,
    streamingSoftwareConfig,
    switcherConfig
  };
};
