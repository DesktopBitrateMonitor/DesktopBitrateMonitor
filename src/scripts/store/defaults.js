import Main from 'electron/main';
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
  const isSystemDark = Main?.nativeTheme?.shouldUseDarkColors ?? true;

  // Default configuration for the application with default values
  const appConfig = new Store({
    name: 'app-config',
    defaults: {
      theme: isSystemDark ? 'dark' : 'light',
      language: 'en',
      layout: {
        sidebarCollapsed: false,
        dashboard: {
          sidebar: {
            open: true
          }
        },
        settings: {
          layout: {}
        }
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

  const accountsConfig = new Store({
    name: 'accounts-config',
    defaults: {
      broadcaster: {
        id: '',
        login: '',
        display_name: '',
        access_token: '',
        refresh_token: '',
        scopes: [],
        profile_image_url: ''
      },
      bot: {
        id: '',
        login: '',
        display_name: '',
        access_token: '',
        refresh_token: '',
        scopes: [],
        profile_image_url: ''
      },
      layout: 'list',
      collapsed: [],
      useBotAccount: false,
      admins: [],
      mods: []
    }
  });

  const commandsConfig = new Store({
    name: 'commands-config',
    defaults: {
      layout: 'list',
      filter: 'all',
      sort: 'none',
      order: [],
      collapsed: [],
      orderGroups: ['admin', 'mod', 'user'],
      commands: [...adminCommands, ...modCommands, ...userCommands]
    }
  });

  const messagesConfig = new Store({
    name: 'messages-config',
    defaults: {
      layout: 'list',
      filter: 'all',
      order: [],
      collapsed: [],
      orderGroups: ['admin', 'mod', 'user'],
      messages: messages
    }
  });

  const serverConfig = new Store({
    name: 'server-config',
    defaults: {
      currentType: 'srt-live-server',
      openirl: {
        name: 'OpenIRL',
        statsUrl: '',
        provider: ''
      },
      'srt-live-server': {
        name: 'SrtLiveServer',
        statsUrl: '',
        provider: ''
      },
      belabox: {
        name: 'Belabox',
        statsUrl: '',
        provider: ''
      }
    }
  });

  const streamingSoftwareConfig = new Store({
    name: 'streaming-software-config',
    defaults: {
      currentType: 'obs-studio',
      ['obs-studio']: {
        name: 'OBS Studio',
        host: 'localhost',
        port: 4455,
        password: ''
      },
      ['streamlabs-obs']: {
        name: 'Streamlabs OBS',
        host: 'localhost',
        port: 4455,
        password: ''
      }
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
    commandsConfig,
    messagesConfig,
    accountsConfig,
    serverConfig,
    streamingSoftwareConfig,
    switcherConfig
  };
};
