export function normalizeAlias(command) {
  const trimmed = command.replace(/\s/g, ''); // Trim all whitespace
  return trimmed;
}

/**
 * Sort an array of Twitch command objects by various modes.
 *
 * @param {Array} commands
 * @param {string} mode
 *   'roleAdmin' | 'roleMod' | 'roleUser' | 'enabled' | 'disabled' | 'titleAsc' | 'titleDesc'
 *   Defaults to 'roleAdmin' (admin first).
 * @returns {Array}
 */
export function sortTwitchCommands(commands, mode = 'roleAdmin') {
  const base = Array.isArray(commands) ? commands : [];
  const copy = [...base];

  if (!mode || mode === 'none') {
    return copy;
  }

  if (mode === 'enabled') {
    return copy.sort((a, b) => Number(Boolean(b.enabled)) - Number(Boolean(a.enabled)));
  }

  if (mode === 'disabled') {
    return copy.sort((a, b) => Number(Boolean(a.enabled)) - Number(Boolean(b.enabled)));
  }

  if (mode === 'titleAsc' || mode === 'titleDesc') {
    const direction = mode === 'titleAsc' ? 1 : -1;
    return copy.sort((a, b) => {
      const aTitle = (a.label || '').toLowerCase();
      const bTitle = (b.label || '').toLowerCase();
      if (aTitle < bTitle) return -1 * direction;
      if (aTitle > bTitle) return 1 * direction;
      return 0;
    });
  }

  const rolePriorityMaps = {
    roleAdmin: { admin: 0, mod: 1, user: 2 },
    roleMod: { mod: 0, admin: 1, user: 2 },
    roleUser: { user: 0, mod: 1, admin: 2 }
  };

  const rolePriority = rolePriorityMaps[mode] || rolePriorityMaps.roleAdmin;
  const fallback = Object.keys(rolePriority).length;

  return copy.sort((a, b) => {
    const aRole = a?.requiredRole;
    const bRole = b?.requiredRole;
    const aIndex = Object.prototype.hasOwnProperty.call(rolePriority, aRole)
      ? rolePriority[aRole]
      : fallback;
    const bIndex = Object.prototype.hasOwnProperty.call(rolePriority, bRole)
      ? rolePriority[bRole]
      : fallback;
    return aIndex - bIndex;
  });
}
