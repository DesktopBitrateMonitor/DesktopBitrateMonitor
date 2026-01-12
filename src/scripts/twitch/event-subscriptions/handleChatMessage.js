import { injectDefaults } from '../../store/defaults';
import { hasPermission } from './lib';

export function handleChatMessage(eventSub) {
  const { messagesConfig, commandsConfig, twitchAccountsConfig } = injectDefaults();

  const event = eventSub.event;
  const {
    source_broadcaster_user_id,
    broadcaster_user_id,
  } = eventSub.event;
  const message = event.message.text;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();

  // Check if the message comes from the write channel
  if (source_broadcaster_user_id && broadcaster_user_id !== source_broadcaster_user_id) return;

  // Check if the command exists in the list of all aliases, otherwise ignore
  if (!allAliases.includes(commandName)) return;

  // Handle Broadcaster only commands
  if (hasPermission({ event, requiredRole: 'broadcaster' })) {
  }

  // Handle Admin only commands
  if (hasPermission({ event, requiredRole: 'admin' })) {
  }

  // Handle Mod only commands
  if (hasPermission({ event, requiredRole: 'mod' })) {
  }

  // Handle Everyone commands
  if (hasPermission({ event, requiredRole: 'user' })) {
  }
}
