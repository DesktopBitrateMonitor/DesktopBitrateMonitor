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
 * @param {string} commandId - The unique identifier of the command
 * @param {string} role - The role of the user executing the command
 * @param {object} coolDowns - The cooldown configuration for the command, with properties like 'all', 'mod', 'user' specifying cooldown durations in seconds
 * @returns {getRemainingCommandCooldown} The remaining cooldown time in milliseconds. Returns 0 if no cooldown is active.
 */

export const getRemainingCommandCooldown = ({ commandId, role, coolDowns }) => {
  const now = Date.now();
  const scopes = cooldownScopesByRole[role] || ['all'];

  let remainingMs = 0;

  for (const scope of scopes) {
    const seconds = Number(coolDowns?.[scope] ?? 0);
    if (seconds <= 0) continue;

    const expiresAt = commandCooldowns.get(`${commandId}:${scope}`) ?? 0;
    remainingMs = Math.max(remainingMs, expiresAt - now);
  }

  return remainingMs;
};

/**
 *
 * @param {string} commandId - The unique identifier of the command
 * @param {string} role - The role of the user executing the command
 * @param {object} coolDowns - The cooldown configuration for the command, with properties like 'all', 'mod', 'user' specifying cooldown durations in seconds
 */

export const startCommandCooldown = ({ commandId, role, coolDowns }) => {
  const now = Date.now();
  const scopes = cooldownScopesByRole[role] || ['all'];

  for (const scope of scopes) {
    const seconds = Number(coolDowns?.[scope] ?? 0);
    if (seconds <= 0) continue;

    commandCooldowns.set(`${commandId}:${scope}`, now + seconds * 1000);
  }
};
