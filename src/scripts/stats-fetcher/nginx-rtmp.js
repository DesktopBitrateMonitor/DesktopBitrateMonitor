const ZERO_STATS = { bitrate: 0, rtt: 0, uptime: 0 };

/**
 * @param {object} statsData  - Raw response envelope from stats-fetcher
 * @param {object} instance   - Server instance { statsUrl, publisher, ... }
 */
export async function formatStatsNginxRtmp(statsData, instance) {
  if (!statsData.success) return { success: false, data: ZERO_STATS, error: null };

  try {
    const streamName = instance.publisher.split('/').slice(-1)[0];
    const res = findStreamByName(statsData.data, streamName);

    if (!res.success) {
      return {
        success: true,
        data: ZERO_STATS,
        error: { message: `Stream "${streamName}" not found in Nginx RTMP stats` }
      };
    }

    const streamData = res.data;
    const isLive = streamData?.includes('<active/>');

    const bwVideo = extractXmlValue(streamData, 'bw_video');
    const bitrate = bwVideo ? parseInt(bwVideo) / 1024 : 0;
    const time = extractXmlValue(streamData, 'time');
    const uptime = time ? parseInt(time / 1000) : 0;
    const width = parseInt(extractXmlValue(streamData, 'width')) || 0;
    const height = parseInt(extractXmlValue(streamData, 'height')) || 0;
    const framerate = parseInt(extractXmlValue(streamData, 'frame_rate')) || 0;

    if (isLive) {
      return {
        success: true,
        data: {
          bitrate: Number(bitrate.toFixed(0)),
          publisher: instance.publisher,
          rtt: 0,
          uptime,
          width,
          height,
          framerate,
          isLive
        },
        error: null
      };
    }

    return { success: true, data: ZERO_STATS, error: null };
  } catch (error) {
    return {
      success: false,
      data: ZERO_STATS,
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
