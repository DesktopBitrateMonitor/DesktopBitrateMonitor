const ZERO_STATS = { bitrate: 0, rtt: 0, uptime: 0 };

/**
 * @param {object} statsData  - Raw response envelope from stats-fetcher
 * @param {object} instance   - Server instance { statsUrl, publisher, ... }
 */
export async function formatStatsBelabox(statsData, instance) {
  if (!statsData.success) return { success: false, data: ZERO_STATS, error: null };

  try {
    const publishers = statsData.data?.publishers ?? {};

    if (Object.keys(publishers).length > 0) {
      if (instance.publisher === Object.keys(publishers)[0]) {
        const livePublisherData = publishers[Object.keys(publishers)[0]];
        return {
          success: true,
          data: {
            bitrate: livePublisherData?.bitrate || 0,
            rtt: livePublisherData?.rtt || 0,
            uptime: livePublisherData?.uptime || 0
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
      error: { message: `Error parsing Belabox stats: ${error.message}` }
    };
  }
}
