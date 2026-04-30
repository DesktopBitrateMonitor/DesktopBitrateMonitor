import { templateParser } from '../../lib/template-parser';
import { injectDefaults } from '../../store/defaults';
import Logger from '../../logging/logger';
import { sendChatMessage } from '../youtube-api';

export async function youtubeMessageService({ action, event, variables = {} }) {
  const { messagesConfig, youtubeAccountsConfig } = injectDefaults();
  const allMessages = messagesConfig.get('messages');

  const messageObj = allMessages.find(
    (msg) => msg.action === action && msg.event === event && msg.enabled
  );

  if (!messageObj || !messageObj.enabled) return null;
  let message = messageObj.message;

  message = templateParser(message, variables);

  const youtubeConfig = youtubeAccountsConfig.get('');
  const broadcaster_id = youtubeConfig.broadcaster.id;
  const bot_id = youtubeConfig.bot.id;
  const useBotAccount = youtubeConfig.useBotAccount;
  const sender_id = bot_id !== '' && useBotAccount ? bot_id : broadcaster_id;
  const accountType = bot_id !== '' && useBotAccount ? 'bot' : 'broadcaster';

  Logger.log(`Chat message for action: "${action}" and event: "${event}" processed successfully`);

  const res = await sendChatMessage(message, accountType);

  if (res.success) {
    Logger.log(`Chat message for action: "${action}" and event: "${event}" sent successfully`);
    return { success: true, error: null };
  } else {
    Logger.error(
      `Failed to send chat message for action: "${action}" and event: "${event}": ${res.error}`
    );
    return { success: false, error: res.error };
  }
}
