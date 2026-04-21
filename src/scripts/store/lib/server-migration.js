import generateId from '../../lib/id-generator';
import { isSameJson } from './merge-helpers';

const legacyServerTypeDefaults = {
  openirl: {
    name: 'OpenIRL',
    statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats/play/live/key_xxxxxxx?legacy=1',
    publisher: 'live'
  },
  'srt-live-server': {
    name: 'SrtLiveServer',
    statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats',
    publisher: 'publish/live/key_xxxxxxx'
  },
  belabox: {
    name: 'Belabox',
    statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats',
    publisher: 'publish/live/key_xxxxxxx'
  },
  'nginx-rtmp': {
    name: 'Nginx RTMP',
    statsUrl: 'http://xxx.xxx.xxx.xxx:8080/stats',
    publisher: 'stream/key_xxxxxxx'
  }
};

const legacyServerTypeKeys = Object.keys(legacyServerTypeDefaults);

// Migrate servers from older app version (below 1.0.4) - remove this migration code in future versions

/**
 * @param {Store} serverConfig - The server configuration store instance
 * @returns {void}
 */

export function migrateServerConfig(serverConfig) {
  const existingServerInstances = serverConfig.get('serverInstances');
  const shouldMigrateLegacyServers =
    !Array.isArray(existingServerInstances) || existingServerInstances.length === 0;

  if (shouldMigrateLegacyServers) {
    const migratedServers = [];

    for (const serverType of legacyServerTypeKeys) {
      const legacyServer = serverConfig.get(serverType);
      if (!legacyServer || typeof legacyServer !== 'object') continue;

      if (!isSameJson(legacyServer, legacyServerTypeDefaults[serverType])) {
        migratedServers.push({
          id: generateId(),
          serverType: serverType,
          name: legacyServer.name,
          statsUrl: legacyServer.statsUrl,
          publisher: legacyServer.publisher,
          enabled: true
        });
      }
    }

    if (migratedServers.length > 0) {
      serverConfig.set('serverInstances', migratedServers);
      serverConfig.delete('currentType');
    }

    for (const serverType of legacyServerTypeKeys) {
      if (serverConfig.has(serverType)) {
        serverConfig.delete(serverType);
        serverConfig.delete('currentType');
      }
    }
  }
}
