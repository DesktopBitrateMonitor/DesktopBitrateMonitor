const ZERO_STATS = { bitrate: 0, rtt: 0, uptime: 0 };

/**
 * @param {object} statsData  - Raw response envelope from stats-fetcher
 * @param {object} instance   - Server instance { statsUrl, publisher, ... }
 */
export async function formatStatsOpenIrl(statsData, instance) {
  if (!statsData.success) return { success: false, data: ZERO_STATS, error: null };

  try {
    const isLegacy = instance.statsUrl.includes('legacy');

    if (!isLegacy) {
      const publisherData = statsData.data?.publisher || {};

      if (Object.keys(publisherData).length > 0) {
        return {
          success: true,
          data: {
            bitrate: publisherData.bitrate,
            rtt: publisherData.rtt,
            uptime: publisherData.uptime
          },
          error: null
        };
      }

      return { success: true, data: ZERO_STATS, error: null };
    }

    // Legacy response — publisher key must match instance.publisher
    const publishers = statsData.data?.publishers ?? {};
    if (Object.keys(publishers).length > 0) {
      if (instance.publisher === Object.keys(publishers)[0]) {
        const livePublisherData = publishers[Object.keys(publishers)[0]];
        return {
          success: true,
          data: {
            bitrate: livePublisherData.bitrate,
            rtt: livePublisherData.rtt,
            uptime: livePublisherData.uptime
          },
          error: null
        };
      }
    }

    return { success: true, data: ZERO_STATS, error: null };
  } catch (error) {
    return {
      success: false,
      data: ZERO_STATS,
      error: { message: `Error parsing OpenIRL stats: ${error.message}` }
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
