import { stopStream } from '../../streaming-software/obs-api';
import { injectDefaults } from '../../store/defaults';

import { twitchMessageService } from '../message-service/chat-messages';
import Logger from '../../logging/logger';

const { twitchAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export async function handleRaid(eventSub) {
  const { event } = eventSub;

  const serverSettings = serverConfig.get('');
  const serverType = serverSettings.currentType;
  const serverName = serverSettings[serverType].name;

  const from_broadcaster_user_name = event.from_broadcaster_user_name.toLowerCase();
  const to_broadcaster_user_name = event.to_broadcaster_user_name;

  const relevantBroadcaster = twitchAccountsConfig.get('broadcaster.login') || null;

  if (!relevantBroadcaster) {
    await twitchMessageService({ action: 'raid', event: 'error', variables: { server: serverName } });
    Logger.error('Error handling raid event: No Twitch broadcaster configured in app config');
    return;
  }

  if (relevantBroadcaster === from_broadcaster_user_name) {
    await twitchMessageService({
      action: 'raid',
      event: 'success',
      variables: { channel: to_broadcaster_user_name, server: serverName }
    });
  }

  if (switcherConfig.get('stopStreamAfterRaid')) {
    const res = await stopStream();
    if (!res.success) {
      await twitchMessageService({ action: 'stopStream', event: 'error', variables: { server: serverName } });
      Logger.error('Error handling raid event: Failed to stop stream after raid', {
        error: res.error
      });
      return;
    }
    if (res.success) {
      await twitchMessageService({ action: 'stopStream', event: 'success', variables: { server: serverName } });
    }
  }
}
