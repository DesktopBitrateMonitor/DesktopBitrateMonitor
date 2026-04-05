import axios from 'axios';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import { formatStatsOpenIrl } from './openirl';
import { formatStatsSrtLiveServer } from './srt-live-server';
import { formatStatsBelabox } from './belabox';
import { switcherService } from '../switcher-service';
import { formatStatsNginxRtmp } from './nginx-rtmp';

let fetchInterval = null;
const fetchingTimeout = 1000;

const response = {
  success: false,
  server: null,
  fetchingInterval: fetchingTimeout,
  storedPublisher: null,
  data: null,
  error: null
};

/**
 *
 * @param {boolean|false} fetchingActive The fetching status
 * @param {string|null} serverType The server type to fetch stats from
 * @param {BrowserWindow|null} mainWindow The main Electron window
 * @returns
 */
export async function startFetchingStats(
  fetchingActive = false,
  serverType = null,
  mainWindow = null
) {
  clearInterval(fetchInterval);
  if (!fetchingActive) return;
  if (!serverType) {
    Logger.log('No server type specified for stats fetching.');
  }

  const { serverConfig } = injectDefaults();

  const fetchAndUpdate = async () => {
    const serverData = serverConfig.get(serverType);
    const stats = await fetchStats(serverData.statsUrl);

    try {
      if (serverType !== 'nginx-rtmp') {
        if (stats && stats?.data?.status?.toLowerCase() === 'ok') {
          response.success = true;
          response.server = serverType;
          response.data = stats?.data;
          response.storedPublisher = serverData?.publisher;
          response.error = null;
        } else {
          response.success = false;
          response.server = serverType;
          response.data = null;
          response.storedPublisher = serverData?.publisher;
          response.error = stats?.data || 'Failed to fetch stats from the server';
        }

        if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
          mainWindow?.webContents?.send('server-connected', response);
        }
      } else {
        if (stats && stats?.statusText?.toLowerCase() === 'ok') {
          response.success = true;
          response.server = serverType;
          response.data = stats.data; // Nginx raw RTMP stats data for further processing in the app backend
          response.storedPublisher = serverData?.publisher;
          response.error = null;
        } else {
          response.success = false;
          response.server = serverType;
          response.data = null;
          response.storedPublisher = serverData?.publisher;
          response.error = stats || 'Failed to fetch stats from the server';
        }
      }

      if (serverType === 'openirl') {
        const res = await formatStatsOpenIrl(response);
        await switcherService(res, mainWindow);
      }
      if (serverType === 'srt-live-server') {
        const res = await formatStatsSrtLiveServer(response);
        await switcherService(res, mainWindow);
      }
      if (serverType === 'belabox') {
        const res = await formatStatsBelabox(response);
        await switcherService(res, mainWindow);
      }
      if (serverType === 'nginx-rtmp') {
        const res = await formatStatsNginxRtmp(response);
        await switcherService(res, mainWindow);

        if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
          const result = {
            ...response,
            data: res.data
          };
          mainWindow?.webContents?.send('server-connected', result);
        }
      }
    } catch (error) {
      Logger.error(`Error processing fetched stats: ${error.message}`);
    }
  };

  fetchInterval = setInterval(fetchAndUpdate, fetchingTimeout);
}

export function stopFetchingStats() {
  clearInterval(fetchInterval);
  fetchInterval = null;
}

export async function fetchStats(statsUrl) {
  try {
    const stats = await axios.get(statsUrl);
    return stats;
  } catch (error) {
    Logger.log(`Error fetching stats: ${error.message}`);
  }
}
