import { templateParser } from '../../lib/template-parser';
import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { sendChatMessage } from '../twitch-api';

export async function messageService({ action, event, variables = {} }) {
  const { messagesConfig, twitchAccountsConfig } = injectDefaults();
  const allMessages = messagesConfig.get('messages');

  const messageObj = allMessages.find(
    (msg) => msg.action === action && msg.event === event && msg.enabled
  );

  if (!messageObj || !messageObj.enabled) return null;
  let message = messageObj.message;

  message = templateParser(message, variables);

  const twitchConfig = twitchAccountsConfig.get('');
  const broadcaster_id = twitchConfig.broadcaster.id;
  const bcAccess_token = twitchConfig.broadcaster.access_token;
  const botAccess_token = twitchConfig.bot.access_token;
  const bot_id = twitchConfig.bot.id;
  const useBotAccount = twitchConfig.useBotAccount;
  const sender_id = bot_id !== '' && useBotAccount ? bot_id : broadcaster_id;
  const access_token = bot_id !== '' && useBotAccount ? botAccess_token : bcAccess_token;
  const accountType = bot_id !== '' && useBotAccount ? 'bot' : 'broadcaster';

  const res = await sendChatMessage(access_token, accountType, broadcaster_id, sender_id, message);

  if (res.success) {
    Logger.log('Chat message sent successfully');
    return { success: true, error: null };
  } else {
    Logger.error(`Failed to send chat message: ${res.error}`);
    return { success: false, error: res.error };
  }
}
