import Main, { app } from 'electron/main';
import path from 'path';
import { adminCommands } from './commands/admin-commands';
import { modCommands } from './commands/mod-commands';
import { userCommands } from './commands/user-commands';
import { buildMessages } from './messages/messages';
import Store from './store';

const defaultSessionLoggingPath = path.join(
  app.getPath('documents'),
  'DesktopBitrateMonitor',
  'FeedLogs'
);
const defaultActionsLoggingPath = path.join(
  app.getPath('documents'),
  'DesktopBitrateMonitor',
  'ActionLogs'
);

const preferredSystemLanguages = app.getPreferredSystemLanguages();
const language =
  preferredSystemLanguages && preferredSystemLanguages.length > 0
    ? preferredSystemLanguages[0].split('-')[0]
    : 'en';

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
      language,
      layout: {
        sidebarCollapsed: false
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
      onQuit: 'quit',
      activePlatform: 'twitch',
      autoCheckForUpdates: true,
      autoInstallUpdates: false,
      lastUpdateCheck: null,
      layout: {}
    }
  });

  const loggingConfig = new Store({
    name: 'logging-config',
    defaults: {
      layout: 'list',
      filter: 'all',
      sort: 'none',
      sessionLogsPath: defaultSessionLoggingPath,
      sessionLogsFileSize: 5,
      actionsLogsPath: defaultActionsLoggingPath,
      logActions: true,
      logSessions: true,
      messageMode: 'simple' // 'simple' or 'detailed'
    }
  });

  const twitchAccountsConfig = new Store({
    name: 'twitch-accounts-config',
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
      layout: 'grid',
      userLayout: 'grid',
      collapsed: [],
      useBotAccount: false,
      admins: [],
      mods: []
    }
  });

  const kickAccountsConfig = new Store({
    name: 'kick-accounts-config',
    defaults: {
      broadcaster: {
        id: '',
        login: '',
        display_name: '',
        access_token: '',
        refresh_token: '',
        scopes: [],
        profile_image_url: '',
        channelId: '',
        chatroomId: ''
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
      layout: 'grid',
      userLayout: 'grid',
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
      messages: buildMessages(language)
    }
  });

  const serverConfig = new Store({
    name: 'server-config',
    defaults: {
      currentType: 'srt-live-server',
      openirl: {
        name: 'OpenIRL',
        statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats/play/live/key_xxxxxxx?legacy=1',
        publisher: 'live'
      },
      'srt-live-server': {
        name: 'SrtLiveServer',
        statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats',
        publisher: 'publish/live/key_xxxxxxx'
      },
      belabox: {
        name: 'Belabox',
        statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats',
        publisher: 'publish/live/key_xxxxxxx'
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
        port: 59650,
        password: ''
      },
      ['meld-studio']: {
        name: 'Meld Studio',
        host: 'localhost',
        port: 4455,
        password: ''
      }
    }
  });

  const switcherConfig = new Store({
    name: 'switcher-config',
    defaults: {
      collapsed: [],
      layout: 'list',
      trigger: 400,
      rTrigger: 1200,
      offTrigger: 0,
      triggerToLive: 3,
      triggerToLow: 3,
      triggerToOffline: 3,
      sceneLive: 'LIVE',
      sceneLow: 'FALLBACK',
      sceneOffline: 'OFFLINE',
      scenePrivacy: 'PRIVACY',
      sceneStart: 'INTRO',
      switcherEnabled: true,
      onlySwitchWhenLive: false,
      enableChatNotifications: true,
      switchToStartSceneOnStreamStart: true,
      stopStreamAfterRaid: true
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
    twitchAccountsConfig,
    kickAccountsConfig,
    serverConfig,
    streamingSoftwareConfig,
    switcherConfig
  };
};
