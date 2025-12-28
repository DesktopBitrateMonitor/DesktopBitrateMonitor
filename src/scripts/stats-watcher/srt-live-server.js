import { injectDefaults } from '../store/defaults';

export async function formatStatsSrtLiveServer(statsData) {
  if (!statsData.success) return;
  const { serverConfig } = injectDefaults();

  try {
    // Handle non-legacy responses
    const { data } = statsData;

    if (Object.keys(data.publishers).length > 0) {
      if (serverConfig.get('srt-live-server.publisher') === Object.keys(data.publishers)[0]) {
        const livePublisherKey = Object.keys(data.publishers)[0];
        const livePublisherData = data.publishers[livePublisherKey];
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
    return {
      success: false,
      data: null,
      error: { message: `Error parsing Open IRL stats: ${error.message}` }
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
