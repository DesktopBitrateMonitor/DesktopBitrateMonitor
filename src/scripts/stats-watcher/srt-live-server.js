const ZERO_STATS = { bitrate: 0, rtt: 0, uptime: 0 };

/**
 * @param {object} statsData  - Raw response envelope from stats-fetcher
 * @param {object} instance   - Server instance { statsUrl, publisher, ... }
 */
export async function formatStatsSrtLiveServer(statsData, instance) {
  if (!statsData.success) return { success: false, data: ZERO_STATS, error: null };

  try {
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
      error: { message: `Error parsing SRT Live Server stats: ${error.message}` }
    };
  }
}

/*NON LEGACY RESPONSE EXAMPLES:
stats: {publishers: {…}, status: 'ok'}
publishers: {}
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
[[Prototype]]: Object


stats: {publishers: {…}, status: 'ok'}
publishers: {publish/live/yinks87_45245650_Xl4ppnPy3IRHxyJac1EiZZ0JJHPhF0Vh: {…}}
publish/live/yinks87_45245650_Xl4ppnPy3IRHxyJac1EiZZ0JJHPhF0Vh: {bitrate: 4016, bytesRcvDrop: 0, bytesRcvLoss: 1098880, mbpsBandwidth: 322.584, mbpsRecvRate: 3.125262476906353, …}
bitrate: 4016
bytesRcvDrop: 0
bytesRcvLoss: 1098880
mbpsBandwidth: 322.584
mbpsRecvRate: 3.125262476906353
msRcvBuf: 2995
pktRcvDrop: 0
pktRcvLoss: 808
rtt: 16.932
uptime: 13
[[Prototype]]: Object
[[Prototype]]: Object
status: 'ok'
[[Prototype]]: Object
[[Prototype]]: Object

*/
