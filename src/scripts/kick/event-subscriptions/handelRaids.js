import { stopStream } from '../../streaming-software/obs-api';
import { injectDefaults } from '../../store/defaults';

import { kickMessageService } from '../messages-service/chat-messages';
import Logger from '../../logging/logger';

const { kickAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export async function handleRaid(eventSub) {
  const serverSettings = serverConfig.get('');
  const serverName = serverSettings.serverInstances?.[0]?.name || 'undefined';

  const fromBroadcaster = eventSub.channel.slug;
  const relevantBroadcaster = kickAccountsConfig.get('broadcaster.login').toLowerCase() || null;
  const toBroadcaster = eventSub.hosted.username || eventSub.hosted.slug;

  if (!fromBroadcaster) {
    await kickMessageService({ action: 'raid', event: 'error', variables: { server: serverName } });
    Logger.error('Error handling raid event: No Kick broadcaster configured in app config');
    return;
  }

  if (relevantBroadcaster === fromBroadcaster) {
    await kickMessageService({
      action: 'raid',
      event: 'success',
      variables: { channel: toBroadcaster, server: serverName }
    });
  }

  if (switcherConfig.get('stopStreamAfterRaid')) {
    const res = await stopStream();
    if (!res.success) {
      await kickMessageService({
        action: 'stopStream',
        event: 'error',
        variables: { server: serverName }
      });
      Logger.error(`Error handling raid event: Failed to stop stream after raid: ${res.error}`);
      return;
    }
    if (res.success) {
      await kickMessageService({
        action: 'stopStream',
        event: 'success',
        variables: { server: serverName }
      });
    }
  }
}
