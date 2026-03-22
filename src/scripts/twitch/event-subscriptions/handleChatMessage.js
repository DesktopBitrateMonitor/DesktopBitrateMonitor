import { injectDefaults } from '../../store/defaults';
import { hasPermission } from './lib';
import { twitchMessageService } from '../message-service/chat-messages';
import { commandActions } from '../../shared-chat-functions/command-actions';
import { getCurrentProgramScene } from '../../streaming-software/obs-api';
import Logger from '../../logging/logger';
import { ifCurrentSceneIsPrivacyScene } from '../../shared-chat-functions/lib';

const { commandsConfig, twitchAccountsConfig, switcherConfig, streamingSoftwareConfig } =
  injectDefaults();

export async function handleChatMessage(eventSub) {
  const event = eventSub.event;
  const { source_broadcaster_user_id, broadcaster_user_id } = eventSub.event;
  const message = event.message.text;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.splice(1).join(' ').toLowerCase();

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();

  // Check if the message comes from the write channel
  if (source_broadcaster_user_id && broadcaster_user_id !== source_broadcaster_user_id) return;

  // Check if the command exists in the list of all aliases, otherwise ignore
  if (!allAliases.includes(commandName)) return;

  // Find the command object based on the command name
  const commandObject = commandsArray.find((cmd) => cmd.cmd.includes(commandName));
  if (!commandObject) return;

  // Check if the command is enabled, if not ignore
  if (!commandObject.enabled) return;

  // Check if the user has the required permissions to execute the command
  const requiredCommandRole = commandObject.requiredRole;
  if (!requiredCommandRole) return;

  // If the user has permissions, execute the command action
  if (
    hasPermission({
      event,
      requiredRole: requiredCommandRole,
      restricted: commandObject.restricted,
      inPrivacyScene: await ifCurrentSceneIsPrivacyScene()
    })
  ) {
    commandActions({
      platform: 'twitch',
      messageService: twitchMessageService,
      switcherConfig,
      accountConfig: twitchAccountsConfig
    })[commandObject.action](commandArg);
  }
}
