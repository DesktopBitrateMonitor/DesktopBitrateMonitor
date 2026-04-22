import { injectDefaults } from '../../store/defaults';
import { getKickUserRole, hasPermission } from '../lib';
import { kickMessageService } from '../messages-service/chat-messages';
import { commandActions } from '../../shared-chat-functions/command-actions';
import {
  getRemainingCommandCooldown,
  ifCurrentSceneIsPrivacyScene,
  startCommandCooldown
} from '../../shared-chat-functions/lib';
import Logger from '../../logging/logger';

const { commandsConfig, kickAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export async function handleChatMessage(rawMessage) {
  const message = rawMessage.content;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.slice(1).join(' ').toLowerCase();
  const aliasCommand = args[1]?.toLowerCase();
  const alias = args[2]?.toLowerCase();
  const aliasToRemove = args[1]?.toLowerCase();

  const commandArgs = { commandArg, aliasCommand, alias, aliasToRemove };

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();

  // TODO
  // Check if the message comes from the logged in channel
  // Figure out if Kick has a multi chat feature and if so, how to identify the source channel of the message
  // if (source_broadcaster_user_id && broadcaster_user_id !== source_broadcaster_user_id) return;

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

  const serverSettings = serverConfig.get('');
  const serverName = serverSettings.serverInstances?.[0]?.name || 'undefined';

  const role = getKickUserRole({ event: rawMessage });
  const remainingCooldownMs = getRemainingCommandCooldown({
    platform: 'kick',
    commandId: commandObject.id,
    role,
    coolDowns: commandObject.coolDowns
  });

  if (remainingCooldownMs > 0) {
    Logger.info(`Command: ${commandName} is on cooldown for ${remainingCooldownMs}ms`);
    return;
  }

  if (
    hasPermission({
      event: rawMessage,
      requiredRole: requiredCommandRole,
      restricted: commandObject.restricted,
      inPrivacyScene: await ifCurrentSceneIsPrivacyScene()
    })
  ) {
    commandActions({
      platform: 'kick',
      messageService: kickMessageService,
      server: serverName,
      switcherConfig,
      commandsConfig,
      accountConfig: kickAccountsConfig
    })[commandObject.action](commandArgs);
  }

  startCommandCooldown({
    platform: 'kick',
    commandId: commandObject.id,
    role,
    coolDowns: commandObject.coolDowns
  });
}
