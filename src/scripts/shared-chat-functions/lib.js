import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';
import { getCurrentProgramScene } from '../streaming-software/obs-api';

const { switcherConfig, streamingSoftwareConfig } = injectDefaults();

// Helper for permission checks

/**
 *
 * @returns {boolean} true or false
 */
export const ifCurrentSceneIsPrivacyScene = async () => {
  const currentSoftware = streamingSoftwareConfig.get('currentType');

  let sceneData;

  if (currentSoftware === 'obs-studio') {
    sceneData = await getCurrentProgramScene();
  }

  if (!sceneData.success) {
    Logger.error(`Failed to get current scene: ${sceneData.error}`);
    return;
  }
  const currentScene = sceneData?.data?.currentProgramSceneName || '';
  const privacyScene = switcherConfig.get('scenePrivacy');

  const inPrivacyScene = currentScene.toLowerCase() === privacyScene.toLowerCase();
  return inPrivacyScene;
};

const commandCooldowns = new Map();

const cooldownScopesByRole = {
  broadcaster: ['all'],
  admin: ['all', 'mod'],
  mod: ['all', 'mod'],
  user: ['all', 'mod', 'user']
};

/**
 * @typedef getRemainingCommandCooldown
 * @type {number} - The remaining cooldown time in milliseconds. Returns 0 if no cooldown is active.
 */

/**
 *
 * @param {string} platform - The platform on which the command is executed
 * @param {string} commandId - The unique identifier of the command
 * @param {string} role - The role of the user executing the command
 * @param {object} coolDowns - The cooldown configuration for the command, with properties like 'all', 'mod', 'user' specifying cooldown durations in seconds
 * @returns {getRemainingCommandCooldown} The remaining cooldown time in milliseconds. Returns 0 if no cooldown is active.
 */

export const getRemainingCommandCooldown = ({ platform, commandId, role, coolDowns }) => {
  // Clean up expired cooldowns before calculating remaining time
  cleanExpiredCooldowns();

  const now = Date.now();
  const scopes = cooldownScopesByRole[role] || ['all'];

  let remainingMs = 0;

  for (const scope of scopes) {
    const seconds = Number(coolDowns?.[scope] ?? 0);
    if (seconds <= 0) continue;

    const expiresAt = commandCooldowns.get(`${platform}:${commandId}:${scope}`) ?? 0;
    remainingMs = Math.max(remainingMs, expiresAt - now);
  }

  return remainingMs;
};

/**
 * @param {string} platform - The platform on which the command is executed
 * @param {string} commandId - The unique identifier of the command
 * @param {string} role - The role of the user executing the command
 * @param {object} coolDowns - The cooldown configuration for the command, with properties like 'all', 'mod', 'user' specifying cooldown durations in seconds
 */

export const startCommandCooldown = ({ platform, commandId, role, coolDowns }) => {
  const now = Date.now();
  const scopes = cooldownScopesByRole[role] || ['all'];

  for (const scope of scopes) {
    const seconds = Number(coolDowns?.[scope] ?? 0);
    if (seconds <= 0) continue;

    commandCooldowns.set(`${platform}:${commandId}:${scope}`, now + seconds * 1000);
  }
};

const cleanExpiredCooldowns = () => {
  const now = Date.now();
  for (const [key, expiresAt] of commandCooldowns.entries()) {
    if (expiresAt <= now) {
      commandCooldowns.delete(key);
    }
  }
};
