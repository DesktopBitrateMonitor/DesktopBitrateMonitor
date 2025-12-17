
/**
 * Sort an array of Twitch command objects by various modes.
 *
 * @param {Array} commands
 * @param {string} mode
 *   'roleAdmin' | 'roleMod' | 'roleUser' | 'roleBroadcaster' | 'enabled' | 'disabled'
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

  // Dynamic role-first ordering: selected role first, then others
  if (mode.startsWith('role')) {
    const selected =
      mode === 'roleBroadcaster'
        ? 'broadcaster'
        : mode === 'roleAdmin'
        ? 'admin'
        : mode === 'roleMod'
        ? 'mod'
        : mode === 'roleUser'
        ? 'user'
        : null;

    const allRoles = ['broadcaster', 'admin', 'mod', 'user'];
    const roleOrder = selected
      ? [selected, ...allRoles.filter((r) => r !== selected)]
      : allRoles;

    const indexOf = (role) => {
      const idx = roleOrder.indexOf(role);
      return idx === -1 ? roleOrder.length : idx;
    };

    return copy.sort((a, b) => indexOf(a?.requiredRole) - indexOf(b?.requiredRole));
  }

  return copy;
}
