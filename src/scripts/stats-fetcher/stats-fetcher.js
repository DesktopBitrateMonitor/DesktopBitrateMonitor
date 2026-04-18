import axios from 'axios';
import Logger from '../logging/logger';
import { formatStatsOpenIrl } from './openirl';
import { formatStatsSrtLiveServer } from './srt-live-server';
import { formatStatsBelabox } from './belabox';
import { formatStatsNginxRtmp } from './nginx-rtmp';
import { broadcastOverlay } from '../app-server/server';
import globalInternalStore from '../store/global-internal-store';
import { switcherService } from '../switcher-service';

const FETCH_INTERVAL_MS = 1000;

// instanceId -> intervalId
const instanceIntervals = new Map();

// instanceId -> latest parsed result { success, data: { bitrate, rtt, uptime }, error }
const instanceStats = new Map();

// enabled instances in their original array order (index 0 = highest priority)
let activeInstances = [];

// Aggregation interval ID (collects all results and sends them at once)
let aggregationInterval = null;

/**
 * Start a polling interval for every enabled server instance.
 * @param {Array} instances - Enabled server instance objects from serverInstances store
 * @param {BrowserWindow|null} mainWindow
 */
export function startFetchingAllInstances(instances, mainWindow) {
  stopFetchingStats();
  activeInstances = [...instances];

  // Start per-instance fetch intervals
  for (const instance of instances) {
    const id = setInterval(() => fetchInstanceAndUpdate(instance, mainWindow), FETCH_INTERVAL_MS);
    instanceIntervals.set(instance.id, id);
  }

  // Start aggregation interval: collect all results and send as one array
  aggregationInterval = setInterval(() => sendAggregatedStats(mainWindow), FETCH_INTERVAL_MS);
}

export function stopFetchingStats() {
  for (const id of instanceIntervals.values()) clearInterval(id);
  if (aggregationInterval) clearInterval(aggregationInterval);
  instanceIntervals.clear();
  aggregationInterval = null;
  instanceStats.clear();
  activeInstances = [];
}

/**
 * Returns a snapshot of all instance stats keyed by instanceId.
 * Used by the switcher service when the multi-instance switching logic is added.
 */
export function getInstanceStats() {
  return new Map(instanceStats);
}

/**
 * Returns the active instances array in priority order.
 */
export function getActiveInstances() {
  return [...activeInstances];
}

async function fetchInstanceAndUpdate(instance) {
  const raw = await fetchStats(instance.statsUrl);

  // Build the raw stats envelope the formatters expect
  const isNginx = instance.serverType === 'nginx-rtmp';
  const httpOk = !!raw;
  const rawEnvelope = {
    success: isNginx
      ? httpOk && raw?.statusText?.toLowerCase() === 'ok'
      : httpOk && raw?.data?.status?.toLowerCase() === 'ok',
    server: instance.name,
    data: raw?.data ?? null,
    storedPublisher: instance.publisher,
    error: httpOk ? null : 'Failed to fetch stats from the server'
  };

  const result = await parseInstanceStats(rawEnvelope, instance);
  const normalized = result ?? {
    success: false,
    data: { bitrate: 0, rtt: 0, uptime: 0 },
    error: null
  };

  instanceStats.set(instance.id, normalized);

  // Keep overlay fed from the highest-priority instance
  updatePrimaryStats();
}

function updatePrimaryStats() {
  if (activeInstances.length === 0) {
    const empty = { bitrate: 0, rtt: 0, uptime: 0 };
    globalInternalStore.stats.set(empty);
    broadcastOverlay({ type: 'stats', stats: empty });
    return;
  }

  // Use the first instance in the array as primary (lowest index = highest priority)
  const primary = activeInstances[0];
  const result = instanceStats.get(primary.id);
  if (!result) return;

  const statsData = result.data ?? { bitrate: 0, rtt: 0, uptime: 0 };
  globalInternalStore.stats.set(statsData);
  broadcastOverlay({ type: 'stats', stats: statsData });
}

function sendAggregatedStats(mainWindow) {
  // Build an array of all active instances with their latest stats
  const aggregatedArray = activeInstances.map((instance) => {
    const currentScene = globalInternalStore.currentScene.get();

    const result = instanceStats.get(instance.id);
    return {
      success: result?.success ?? false,
      data: result?.data ?? { bitrate: 0, rtt: 0, uptime: 0 },
      instance,
      fetchingInterval: FETCH_INTERVAL_MS,
      currentScene
    };
  });

  // Run switcher against all active instance bitrates in priority order.
  switcherService({ instancesStats: aggregatedArray }, mainWindow);

  if (!mainWindow?.webContents || mainWindow.isDestroyed()) return;

  // Send the aggregated array to the renderer
  mainWindow.webContents.send('instances-stats', aggregatedArray);
}

async function parseInstanceStats(rawEnvelope, instance) {
  switch (instance.serverType) {
    case 'openirl':
      return formatStatsOpenIrl(rawEnvelope, instance);
    case 'srt-live-server':
      return formatStatsSrtLiveServer(rawEnvelope, instance);
    case 'belabox':
      return formatStatsBelabox(rawEnvelope, instance);
    case 'nginx-rtmp':
      return formatStatsNginxRtmp(rawEnvelope, instance);
    default:
      Logger.warn(`Unknown server type for instance "${instance.id}": ${instance.name}`);
      return null;
  }
}

export async function fetchStats(statsUrl) {
  try {
    const stats = await axios.get(statsUrl);
    return stats;
  } catch (error) {
    Logger.log(`Error fetching stats: ${error.message}`);
  }
}
