import {
  disconnectKickEventSub,
  connectToKickEventSub
} from '../../scripts/kick/event-subscriptions/eventsubs';
import Logger from '../../scripts/logging/logger';
import { startFetchingStats, stopFetchingStats } from '../../scripts/stats-watcher/stats-fetcher';
import { injectDefaults } from '../../scripts/store/defaults';
import { startOBSConnectionLoop } from '../../scripts/streaming-software/obs-api';
import {
  connectToTwitchEventSubs,
  disconnectTwitchEventSubs
} from '../../scripts/twitch/event-subscriptions/eventsubs';

const {
  appConfig,
  twitchAccountsConfig,
  kickAccountsConfig,
  streamingSoftwareConfig,
  serverConfig
} = injectDefaults();
const client_id = import.meta.env.VITE_TWITCHCLIENTID;

export async function initializeServices(mainWindow = null) {
  Logger.log('Connecting streaming software');
  await connectStreamingSoftware(mainWindow);
  Logger.log('Starting server stats fetching');
  await startFetchingServerStats(mainWindow);
  Logger.log('Connecting active platform');
  await connectToActivePlatform(mainWindow, appConfig.get('activePlatform'));
}

export async function startFetchingServerStats(mainWindow = null) {
  stopFetchingStats(mainWindow);

  const currentType = serverConfig.get('currentType');
  if (currentType === 'openirl') {
    await startFetchingStats(true, 'openirl', mainWindow);
  } 
  
  if (currentType === 'srt-live-server') {
    await startFetchingStats(true, 'srt-live-server', mainWindow);
  }

  if(currentType === 'belabox'){
    console.log('Starting stats fetcher for BelaBox');
  }

  return { success: true, data: { message: 'Server stats fetching started' }, error: null };
}

export async function connectStreamingSoftware(mainWindow) {
  if (streamingSoftwareConfig.get('currentType') === 'obs-studio') {
    await startOBSConnectionLoop(mainWindow);
  }
}

export async function connectToActivePlatform(mainWindow, platform) {
  // Disconnect from all platforms first to ensure a clean slate before reconnecting
  Logger.info('Cleanup all platform connections before reconnecting to the selected platform...');
  disconnectTwitchEventSubs(mainWindow);
  disconnectKickEventSub(mainWindow);

  // Add a short delay to ensure all disconnections are processed before attempting new connections
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (platform === 'twitch') {
    const twitchChannelToConnect = twitchAccountsConfig.get('broadcaster.login');
    if (twitchChannelToConnect.length === 0) {
      Logger.log('No Twitch channel found in twitchAccountsConfig. Skipping Twitch connection.');
      return;
    }
    await connectToTwitchEventSubs(client_id, mainWindow);
  }
  if (platform === 'kick') {
    const kickChannelToConnect = kickAccountsConfig.get('broadcaster.login');
    if (kickChannelToConnect.length === 0) {
      Logger.log('No Kick channel found in kickAccountsConfig. Skipping Kick connection.');
      return;
    }
    await connectToKickEventSub(mainWindow);
  }
  if (platform === 'youtube') {
    Logger.log('YouTube connection not implemented yet.');
  }
}
