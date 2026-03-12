import { templateParser } from '../../lib/template-parser';
import { injectDefaults } from '../../store/defaults';
import Logger from '../../logging/logger';
import { sendChatMessage } from '../kick-api';

export async function kickMessageService({ action, event, variables = {} }) {
  const { messagesConfig, kickAccountsConfig } = injectDefaults();
  const allMessages = messagesConfig.get('messages');

  const messageObj = allMessages.find(
    (msg) => msg.action === action && msg.event === event && msg.enabled
  );

  if (!messageObj || !messageObj.enabled) return null;
  let message = messageObj.message;

  message = templateParser(message, variables);

  const kickConfig = kickAccountsConfig.get('');
  const broadcaster_id = kickConfig.broadcaster.id;
  const bot_id = kickConfig.bot.id;
  const useBotAccount = kickConfig.useBotAccount;
  const accountType = bot_id !== '' && useBotAccount ? 'bot' : 'broadcaster';
  const access_token =
    bot_id !== '' && useBotAccount
      ? kickConfig.bot.access_token
      : kickConfig.broadcaster.access_token;

  const res = await sendChatMessage(access_token, accountType, broadcaster_id, message);

  if (res.success) {
    Logger.log('Chat message sent successfully');
    return { success: true, error: null };
  } else {
    Logger.error(`Failed to send chat message: ${res.error}`);
    return { success: false, error: res.error };
  }
}
