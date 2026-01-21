import { injectDefaults } from '../store/defaults';
import globalInternalStore from '../store/global-internal-store';

export async function formatStatsOpenIrl(statsData) {
  if (!statsData.success) return;
  const { serverConfig } = injectDefaults();

  const statsUrl = serverConfig.get('openirl.statsUrl');

  try {
    // Handle non-legacy responses
    if (!statsUrl.includes('legacy')) {
      const { data } = statsData;
      const publisherData = data?.publisher || {};

      if (Object.keys(publisherData).length > 0) {
        // Store the latest stats in the global internal store for usage in the app backend
        globalInternalStore.stats.set(publisherData);

        return {
          success: true,
          data: {
            bitrate: publisherData.bitrate,
            rtt: publisherData.rtt,
            uptime: publisherData.uptime
          },
          error: null
        };
      } else {
        // Store the latest stats in the global internal store for usage in the app backend
        globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

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
      // Handle legacy responses
      const { data } = statsData;

      if (Object.keys(data.publishers).length > 0) {
        if (serverConfig.get('openirl.publisher') === Object.keys(data.publishers)[0]) {
          const livePublisherKey = Object.keys(data.publishers)[0];
          const livePublisherData = data.publishers[livePublisherKey];

          // Store the latest stats in the global internal store for usage in the app backend
          globalInternalStore.stats.set(livePublisherData);

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
    }
  } catch (error) {
    // Store the latest stats in the global internal store for usage in the app backend
    globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

    return {
      success: false,
      data: null,
      error: { message: `Error parsing Open IRL stats: ${error.message}` }
    };
  }
}

/*

NON LEGACY RESPONSE EXAMPLES:

stats: {message: 'Publisher is currently not streaming', status: 'ok'}
message: 'Publisher is currently not streaming'
status: 'ok'
[[Prototype]]: Object
[[Prototype]]: Object



stats: {publisher: {…}, status: 'ok'}
publisher: {bitrate: 2261, buffer: 2990, dropped_pkts: 0, latency: 3000, rtt: 33.494, …}
bitrate: 2261
buffer: 2990
dropped_pkts: 0
latency: 3000
rtt: 33.494
uptime: 7
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
[[Prototype]]: Object



LEGACY RESPONSE EXAMPLES:

{success: true, server: 'openirl', fetchingInterval: 1000, data: {…}, error: null}
data: {publishers: {…}, status: 'ok'}
publishers: {live: {…}}
live: {bitrate: 3726, bytesRcvDrop: 0, bytesRcvLoss: 4943644, latency: 3000, mbpsBandwidth: 330.828, …}
bitrate: 3726
bytesRcvDrop: 0
bytesRcvLoss: 4943644
latency: 3000
mbpsBandwidth: 330.828
mbpsRecvRate: 3.3834749940744926
msRcvBuf: 2972
pktRcvDrop: 0
pktRcvLoss: 3636
rtt: 32.23
uptime: 38
[[Prototype]]: Object
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
error: null
fetchingInterval: 1000
server: 'openirl'
success: true
[[Prototype]]: Object

data: {publishers: {…}, status: 'ok'}
publishers: {live: {…}}
live: {bitrate: 6178, bytesRcvDrop: 0, bytesRcvLoss: 6268284, latency: 3000, mbpsBandwidth: 1049.712, …}
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
error: null
fetchingInterval: 1000
server: 'openirl'
success: true
[[Prototype]]: Object

data: {message: 'Publisher is currently not streaming', publishers: {…}, status: 'ok'}
message: 'Publisher is currently not streaming'
publishers: {}
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
error: null
fetchingInterval: 1000
server: 'openirl'
success: true
[[Prototype]]: Object


*/
