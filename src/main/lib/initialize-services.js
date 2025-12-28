import Logger from '../../scripts/logging/logger';
import { startFetchingStats, stopFetchingStats } from '../../scripts/stats-watcher/stats-fetcher';
import { injectDefaults } from '../../scripts/store/defaults';
import { startOBSConnectionLoop } from '../../scripts/streaming-software/obs-api';
import {
  connectToEventSubs,
  disconnectEventSubs
} from '../../scripts/twitch/event-subscriptions/eventsubs';

const { accountsConfig, streamingSoftwareConfig, serverConfig } = injectDefaults();
const client_id = import.meta.env.VITE_TWITCHCLIENTID;

export async function initializeServices(mainWindow = null) {
  await connectToTwitchChannel(mainWindow);
  await connectStreamingSoftware(mainWindow);
  await startFetchingServerStats(mainWindow);
}

export async function startFetchingServerStats(mainWindow = null) {
  stopFetchingStats(mainWindow);

  const currentType = serverConfig.get('currentType');
  if (currentType === 'openirl') {
    await startFetchingStats(true, 'openirl', mainWindow);
  } else if (currentType === 'srt-live-server') {
    await startFetchingStats(true, 'srt-live-server', mainWindow);
  }

  return { success: true, data: { message: 'Server stats fetching started' }, error: null };
}

export async function connectStreamingSoftware(mainWindow) {
  if (streamingSoftwareConfig.get('currentType') === 'obs-studio') {
    await startOBSConnectionLoop(mainWindow);
  }
}

export async function connectToTwitchChannel(mainWindow = null) {
  const channelToConnect = accountsConfig.get('broadcaster.login');
  if (channelToConnect.length === 0) {
    Logger.log('No Twitch channel found in accountsConfig. Skipping Twitch connection.');
    return;
  }

  try {
    Logger.log('Cleaning up existing EventSub connections before establishing a new one.');
    disconnectEventSubs(mainWindow);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    Logger.log(`Connecting to Twitch channel: ${channelToConnect}`);
    connectToEventSubs(client_id, mainWindow);
  } catch (error) {
    Logger.log(
      `Error connecting to Twitch channel ID: ${channelToConnect}. Error: ${error.message}`
    );
  }
}
