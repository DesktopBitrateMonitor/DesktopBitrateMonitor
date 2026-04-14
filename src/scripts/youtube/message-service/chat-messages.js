import { templateParser } from '../../lib/template-parser';
import { injectDefaults } from '../../store/defaults';
import Logger from '../../logging/logger';

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
  const bcAccess_token = youtubeConfig.broadcaster.access_token;
  const botAccess_token = youtubeConfig.bot.access_token;
  const bot_id = youtubeConfig.bot.id;
  const useBotAccount = youtubeConfig.useBotAccount;
  const sender_id = bot_id !== '' && useBotAccount ? bot_id : broadcaster_id;
  const access_token = bot_id !== '' && useBotAccount ? botAccess_token : bcAccess_token;
  const accountType = bot_id !== '' && useBotAccount ? 'bot' : 'broadcaster';

  Logger.log(`Chat message for action: "${action}" and event: "${event}" processed successfully`);

  //TODO: implement actual message sending trough youtube api

  const res = { success: true, error: null }; // Placeholder for actual message sending logic

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
