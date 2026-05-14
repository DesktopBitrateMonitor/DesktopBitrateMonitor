import { commandActions } from '../../shared-chat-functions/command-actions';
import {
  getRemainingCommandCooldown,
  ifCurrentSceneIsPrivacyScene,
  startCommandCooldown
} from '../../shared-chat-functions/lib';
import Logger from '../../logging/logger';
import { injectDefaults } from '../../store/defaults';
import { getYoutubeUserRole, hasPermission } from './lib';
import { youtubeMessageService } from '../message-service/chat-messages';

const { commandsConfig, youtubeAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export async function handleChatMessage(rawMessage, livestreamId = null) {
  const message = rawMessage?.item?.message?.text;
  const args = message.split(' ');
  const commandName = args[0].toLowerCase();
  const commandArg = args.slice(1).join(' ').toLowerCase();
  const aliasCommand = args[1]?.toLowerCase();
  const alias = args[2]?.toLowerCase();
  const aliasToRemove = args[1]?.toLowerCase();

  const commandArgs = { commandArg, aliasCommand, alias, aliasToRemove };

  const commandsArray = commandsConfig.get('commands').map((cmd) => ({ ...cmd }));
  const allAliases = commandsArray.map((cmd) => cmd.cmd).flat();

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

  const role = getYoutubeUserRole({ event: rawMessage });
  const remainingCooldownMs = getRemainingCommandCooldown({
    platform: 'youtube',
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
    const scopedYoutubeMessageService = (payload) =>
      youtubeMessageService({
        ...payload,
        context: { livestreamId }
      });

    commandActions({
      platform: 'youtube',
      messageService: scopedYoutubeMessageService,
      server: serverName,
      switcherConfig,
      commandsConfig,
      accountConfig: youtubeAccountsConfig
    })[commandObject.action](commandArgs);
  }

  startCommandCooldown({
    platform: 'youtube',
    commandId: commandObject.id,
    role,
    coolDowns: commandObject.coolDowns
  });
}
