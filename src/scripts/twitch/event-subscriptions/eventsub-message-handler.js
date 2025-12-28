import Logger from '../../logging/logger';
import { handleChatMessage } from '../event-subscriptions/handleChatMessage';
import { handleRaid } from './handleRaids';

export function handleEventSub(eventSub) {
  const e = eventSub.subscription?.type ? eventSub.subscription?.type : eventSub.session?.status;

  switch (e) {
    case 'channel.chat.message':
      handleChatMessage(eventSub);
      break;
    case 'channel.raid':
      handleRaid(eventSub);
      break;
    case 'connected':
      Logger.info(`Connected to all eventsubs`);
      break;

    default:
      Logger.error(`Unknown event type...`);
      return { success: false };
  }
}