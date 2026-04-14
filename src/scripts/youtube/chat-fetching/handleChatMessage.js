import { commandActions } from '../../shared-chat-functions/command-actions';
import { ifCurrentSceneIsPrivacyScene } from '../../shared-chat-functions/lib';
import { injectDefaults } from '../../store/defaults';
import { hasPermission } from './lib';
import { youtubeMessageService } from '../message-service/chat-messages';

const { commandsConfig, youtubeAccountsConfig, switcherConfig, serverConfig } = injectDefaults();

export async function handleChatMessage(rawMessage) {
  const message = rawMessage.snippet.displayMessage;
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

  if (
    hasPermission({
      event: rawMessage,
      requiredRole: requiredCommandRole,
      restricted: commandObject.restricted,
      inPrivacyScene: await ifCurrentSceneIsPrivacyScene()
    })
  ) {
    console.log('ready to execute command action');
    // commandActions({
    //   platform: 'youtube',
    //   messageService: youtubeMessageService,
    //   server: serverName,
    //   switcherConfig,
    //   commandsConfig,
    //   accountConfig: youtubeAccountsConfig
    // })[commandObject.action](commandArgs);
  }
  console.log(rawMessage);
}
