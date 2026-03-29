import { broadcastOverlay } from '../app-server/server';
import { injectDefaults } from '../store/defaults';
import globalInternalStore from '../store/global-internal-store';

export async function formatStatsBelabox(statsData) {
  if (!statsData.success) return;
  const { serverConfig } = injectDefaults();

  const statsUrl = serverConfig.get('belabox.statsUrl');

  try {
    const { data } = statsData;

    if (Object.keys(data.publishers).length > 0) {
      if (serverConfig.get('belabox.publisher') === Object.keys(data.publishers)[0]) {
        const livePublisherKey = Object.keys(data.publishers)[0];
        const livePublisherData = data.publishers[livePublisherKey];

        // Store the latest stats in the global internal store for usage in the app backend
        globalInternalStore.stats.set(livePublisherData);

        broadcastOverlay({
          type: 'stats',
          stats: livePublisherData
        });

        return {
          success: true,
          data: {
            bitrate: livePublisherData.bitrate,
            rtt: livePublisherData.rtt,
            uptime: livePublisherData.uptime
          },
          error: null
        };
      } else {
        // Store the latest stats in the global internal store for usage in the app backend
        globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

        // Broadcast the stats to the overlay
        broadcastOverlay({
          type: 'stats',
          stats: { bitrate: 0, rtt: 0, uptime: 0 }
        });

        return {
          success: true,
          data: {
            bitrate: 0,
            rtt: 0,
            uptime: 0
          },
          error: null
        };
      }
    } else {
      // Store the latest stats in the global internal store for usage in the app backend
      globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

      // Broadcast the stats to the overlay
      broadcastOverlay({
        type: 'stats',
        stats: { bitrate: 0, rtt: 0, uptime: 0 }
      });

      return {
        success: true,
        data: {
          bitrate: 0,
          rtt: 0,
          uptime: 0
        },
        error: null
      };
    }
  } catch (error) {
    // Store the latest stats in the global internal store for usage in the app backend
    globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

    // Broadcast the stats to the overlay
    broadcastOverlay({
      type: 'stats',
      stats: { bitrate: 0, rtt: 0, uptime: 0 }
    });

    return {
      success: false,
      data: null,
      error: { message: `Error parsing Belabox stats: ${error.message}` }
    };
  }
}

/*

stats =
{publishers: {…}, status: 'ok'}
publishers =
{live/stream/belabox: {…}}
live/stream/belabox =
{bitrate: 3134, bytesRcvDrop: 0, bytesRcvLoss: 0, mbpsBandwidth: 2317.608, mbpsRecvRate: 0.968892589354998, …}
bitrate =
3134
bytesRcvDrop =
0
bytesRcvLoss =
0
mbpsBandwidth =
2317.608
mbpsRecvRate =
0.968892589354998
msRcvBuf =
2934
pktRcvDrop =
0
pktRcvLoss =
0
rtt =
3.58
uptime =
98
[[Prototype]] =
Object
[[Prototype]] =
Object
status =
'ok'


 */
