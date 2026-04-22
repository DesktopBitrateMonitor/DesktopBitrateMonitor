import {
  disconnectKickEventSub,
  connectToKickEventSub
} from '../../scripts/kick/event-subscriptions/eventsubs';
import Logger from '../../scripts/logging/logger';
import {
  startFetchingAllInstances,
  stopFetchingStats
} from '../../scripts/stats-fetcher/stats-fetcher';
import { injectDefaults } from '../../scripts/store/defaults';
import { startOBSConnectionLoop } from '../../scripts/streaming-software/obs-api';
import {
  connectToTwitchEventSubs,
  disconnectTwitchEventSubs
} from '../../scripts/twitch/event-subscriptions/eventsubs';
// import {
//   startYouTubeChatPolling,
//   stopYouTubeChatPolling
// } from '../../scripts/youtube/chat-fetching/chat-fetcher';

const {
  appConfig,
  twitchAccountsConfig,
  kickAccountsConfig,
  // youtubeAccountsConfig,
  streamingSoftwareConfig,
  serverConfig
} = injectDefaults();

const client_id = import.meta.env.VITE_TWITCHCLIENTID;

export async function initializeServices(mainWindow = null) {
  Logger.log('Connecting streaming software');
  await connectStreamingSoftware(mainWindow);
  Logger.log('Starting server stats fetching');
  await startFetchingServerStats(mainWindow);
  Logger.log('Connecting active platforms');
  await connectToActivePlatforms(mainWindow, appConfig.get('activePlatforms'));
}

export async function startFetchingServerStats(mainWindow = null) {
  stopFetchingStats();

  const instances = serverConfig.get('serverInstances') ?? [];
  const enabledInstances = instances.filter((i) => i.enabled);
  startFetchingAllInstances(enabledInstances, mainWindow);

  return { success: true, data: { message: 'Server stats fetching started' }, error: null };
}

export async function connectStreamingSoftware(mainWindow) {
  if (streamingSoftwareConfig.get('currentType') === 'obs-studio') {
    await startOBSConnectionLoop(mainWindow);
  }
}

export async function connectToActivePlatforms(mainWindow) {
  const platforms = appConfig.get('activePlatforms') || [];
  // Disconnect from all platforms first to ensure a clean slate before reconnecting
  Logger.info('Cleanup all platform connections before reconnecting to the selected platforms...');

  disconnectTwitchEventSubs(mainWindow);
  disconnectKickEventSub(mainWindow);
  // stopYouTubeChatPolling(mainWindow);

  // Add a short delay to ensure all disconnections are processed before attempting new connections
  await new Promise((resolve) => setTimeout(resolve, 1000));

  for (const platform of platforms) {
    if (platform === 'twitch') {
      if (twitchAccountsConfig.get('broadcaster.login').length === 0) {
        Logger.log('No Twitch channel found in twitchAccountsConfig. Skipping Twitch connection.');
        continue;
      }
      connectToTwitchEventSubs(client_id, mainWindow);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (platform === 'kick') {
      if (kickAccountsConfig.get('broadcaster.login').length === 0) {
        Logger.log('No Kick channel found in kickAccountsConfig. Skipping Kick connection.');
        continue;
      }
      connectToKickEventSub(mainWindow);
    }
  }

  // if (platform === 'youtube') {
  //   const youtubeChannelToConnect = youtubeAccountsConfig.get('broadcaster.login');
  //   if (youtubeChannelToConnect.length === 0) {
  //     Logger.log('No YouTube channel found in youtubeAccountsConfig. Skipping YouTube connection.');
  //     return;
  //   }
  //   await startYouTubeChatPolling(mainWindow);
  // }
}
