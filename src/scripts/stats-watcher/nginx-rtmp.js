import { broadcastOverlay } from '../app-server/server';
import { injectDefaults } from '../store/defaults';
import globalInternalStore from '../store/global-internal-store';

export async function formatStatsNginxRtmp(statsData) {
  if (!statsData.success) return;
  const { serverConfig } = injectDefaults();

  const publisher = serverConfig.get('nginx-rtmp.publisher');

  try {
    const res = findStreamByName(statsData.data, publisher.split('/').slice(-1)[0]);

    const streamData = res.data;

    // if the stream was not started the streamname won't be found in the stats
    if (!res.success) {
      // Store the latest stats in the global internal store for usage in the app backend
      globalInternalStore.stats.set({ bitrate: 0, rtt: 0, uptime: 0 });

      // Broadcast the stats to the overlay
      broadcastOverlay({
        type: 'stats',
        stats: { bitrate: 0, rtt: 0, uptime: 0 }
      });

      return {
        success: true,
        data: { bitrate: 0, rtt: 0, uptime: 0 },
        error: { message: `Stream with name ${publisher} not found in Nginx RTMP stats` }
      };
    }

    // Check the stream has an active tag
    const isLive = streamData?.includes('<active/>');

    // Extract the bits/s and calculate the kbps bitrate
    const bwVideo = extractXmlValue(streamData, 'bw_video');
    const bitrate = bwVideo ? parseInt(bwVideo) / 1024 : 0;

    // Extract the uptime in seconds
    const time = extractXmlValue(streamData, 'time');
    const uptime = time ? parseInt(time / 1000) : 0;

    const width = parseInt(extractXmlValue(streamData, 'width')) || 0;
    const height = parseInt(extractXmlValue(streamData, 'height')) || 0;
    const framerate = parseInt(extractXmlValue(streamData, 'frame_rate')) || 0;

    // If <active/> tag are found the stream is live, otherwise we determine the stream as offline
    if (isLive) {
      const response = {
        bitrate: Number(bitrate.toFixed(0)), // Format bitrate to 0 decimal places
        publisher: publisher,
        rtt: 0, // Nginx RTMP does not provide RTT, so set to 0
        uptime,
        width,
        height,
        framerate,
        isLive // Returns true for active streams
      };
      // Store the latest stats in the global internal store for usage in the app backend
      globalInternalStore.stats.set(response);

      // Broadcast the stats to the overlay
      broadcastOverlay({
        type: 'stats',
        stats: response
      });

      return {
        success: true,
        data: response,
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
        data: { bitrate: 0, rtt: 0, uptime: 0 },
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
      error: { message: `Error parsing Nginx RTMP stats: ${error.message}` }
    };
  }
}

const extractXmlValue = (xml, tag) => {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
};

const findStreamByName = (xml, name) => {
  let pos = 0;
  while (pos < xml.length) {
    const streamStart = xml.indexOf('<stream>', pos);
    if (streamStart === -1) break;

    const streamEnd = xml.indexOf('</stream>', streamStart);
    if (streamEnd === -1) break;

    const streamBlock = xml.substring(streamStart, streamEnd + 9);
    const streamName = extractXmlValue(streamBlock, 'name');

    if (streamName === name) return { success: true, data: streamBlock };

    pos = streamEnd + 9;
  }
  return { success: false, error: 'Stream not found' };
};
