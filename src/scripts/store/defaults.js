import Main, { app } from 'electron/main';
import path from 'path';
import { adminCommands } from './commands/admin-commands';
import { modCommands } from './commands/mod-commands';
import { userCommands } from './commands/user-commands';
import { buildMessages } from './messages/messages';
import Store from './store';
import { defaultLayout } from '../../renderer/src/panels/dashboard/components/layout-default';

const PORT = import.meta.env.VITE_SERVERPORT;

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
      layout: {
        dashboardLayout: { ...defaultLayout }
      }
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
      triggerToLive: 0,
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
      switchFromStartingToLive: true,
      stopStreamAfterRaid: true
    }
  });

  const overlayConfig = new Store({
    name: 'overlay-config',
    defaults: {
      expertMode: false,
      showBitrate: true,
      showSpeed: true,
      showUptime: true,
      showTotalUptime: true,
      showIcons: true,
      statsOverlayUrl: `http://localhost:${PORT}/overlay/stats`,
      overlay: {
        expert: {
          html: '<link rel=\"stylesheet\"\r\n    href=\"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200\" />\r\n\r\n<div id=\"root\">\r\n    <div class=\"bitrate-container\">\r\n        <span id=\"bitrate-icon\" class=\"material-symbols-outlined\"\r\n          >signal_cellular_0_bar</span>\r\n        <div class=\"bitrate-txt\">Loading...</div>\r\n    </div>\r\n    <div class=\"speed-container\">\r\n        <span id=\"speed-icon\" class=\"material-symbols-outlined\">speed</span>\r\n        <div class=\"speed-txt\">Loading...</div>\r\n    </div>\r\n    <div class=\"uptime-container\">\r\n        <span id=\"uptime-icon\" class=\"material-symbols-outlined\">timer</span>\r\n        <div class=\"uptime-txt\">Loading...</div>\r\n    </div>\r\n</div>',
          css: ':root {\r\n  --color: #ffffff;\r\n}\r\n\r\n* {\r\n  font-family: Verdana, Geneva, Tahoma, sans-serif;\r\n}\r\n\r\n#root {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: .5rem;\r\n  /* background: rgba(0, 0, 0, 0.397); */\r\n  padding: 8px;\r\n  border-radius: 8px;\r\n  max-width: 200px;\r\n}\r\n\r\n\r\n.bitrate-container,\r\n.speed-container,\r\n.uptime-container {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.5rem;\r\n}\r\n\r\n.material-symbols-outlined {\r\n  font-size: 8px;\r\n  color: var(--color);\r\n}\r\n\r\n.bitrate-txt,\r\n.speed-txt,\r\n.uptime-txt {\r\n  font-size: 24px;\r\n  color: var(--color);\r\n}',
          js: '\r\n// { PROPS } returns the bitrate, speed, uptime from the current active feed, otherwise 0\r\nconst bitrate = PROPS.bitrate\r\nconst speed = PROPS.speed.toFixed(2)\r\nconst uptime = PROPS.uptime\r\n\r\n$(\".bitrate-txt\").text(`${bitrate} kb/s`);\r\n\r\nconst updateImageOnBitrate = () => {\r\n  let imgTxt;\r\n  if (bitrate >= 4000) {\r\n    imgTxt = \"signal_cellular_alt\";\r\n  } else if (bitrate >= 1200) {\r\n    imgTxt = \"signal_cellular_alt_2_bar\";\r\n  } else if (bitrate >= 600) {\r\n    imgTxt = \"signal_cellular_alt_1_bar\";\r\n  } else {\r\n    imgTxt = \"signal_cellular_connected_no_internet_0_bar\";\r\n  }\r\n  $(\"#bitrate-icon\").text(imgTxt);\r\n};\r\n\r\nupdateImageOnBitrate();\r\n\r\n$(".speed-txt").text(`${speed} ms`);\r\n\r\nconst stopwatch = (time) => {\r\n  const h = Math.floor(time / 3600);\r\n  const m = Math.floor((time % 3600) / 60);\r\n  const s = Math.floor(time % 60);\r\n  const two = (n) => n.toString().padStart(2, "0");\r\n  return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;\r\n}\r\n\r\n$(".uptime-txt").text(stopwatch(uptime));',
          data: {}
        },
        easy: {
          html: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" /><div id="root"><div class="bitrate-container"><span id="bitrate-icon" class="material-symbols-outlined">signal_cellular_0_bar</span><div class="bitrate-txt">Loading...</div></div><div class="speed-container"><span id="speed-icon" class="material-symbols-outlined">speed</span><div class="speed-txt">Loading...</div></div><div class="uptime-container"><span id="uptime-icon" class="material-symbols-outlined">timer</span><div class="uptime-txt">Loading...</div></div></div>',
          css: ':root { --icon-color: {{iconColor}}; --font-color: {{fontColor}};} * { font-family: Verdana, Geneva, Tahoma, sans-serif;} #root {display: flex; flex-direction: {{direction}}; gap: {{gap}}px; padding: 8px; border-radius: 8px; max-width: 200px;} .bitrate-container {display: {{bitrateDisplay}}; align-items: center; gap: 0.5rem;} .speed-container {display: {{speedDisplay}}; align-items: center; gap: 0.5rem;} .uptime-container {display: {{uptimeDisplay}}; align-items: center; gap: 0.5rem;} #bitrate-icon, #speed-icon, #uptime-icon {display: {{iconsDisplay}};} .material-symbols-outlined {font-size: 8px; color: var(--icon-color);} .bitrate-txt, .speed-txt, .uptime-txt{text-wrap: nowrap; font-size: 24px; color: var(--font-color);}',
          js: 'const bitrate = PROPS.bitrate; const speed = PROPS.speed.toFixed(2); const uptime = PROPS.uptime; $(".bitrate-txt").text(`${bitrate} kb/s`); const updateImageOnBitrate = () => { let imgTxt; if (bitrate >= 4000) {imgTxt = "signal_cellular_alt";} else if (bitrate >= 1200) {imgTxt = "signal_cellular_alt_2_bar";} else if (bitrate >= 600) {imgTxt = "signal_cellular_alt_1_bar";} else {imgTxt = "signal_cellular_connected_no_internet_0_bar";} $("#bitrate-icon").text(imgTxt);}; updateImageOnBitrate(); $(".speed-txt").text(`${speed} ms`); const stopwatch = (time) => { const h = Math.floor(time / 3600); const m = Math.floor((time % 3600) / 60); const s = Math.floor(time % 60); const two = (n) => n.toString().padStart(2, "0"); return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;}; $(".uptime-txt").text(stopwatch(uptime));',
          data: {
            direction: 'column',
            gap: '8px',
            iconColor: '#ffffff',
            fontColor: '#ffffff'
          }
        }
      }
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
    switcherConfig,
    overlayConfig
  };
};
