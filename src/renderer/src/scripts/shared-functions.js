export function normalizeAlias(command) {
  const trimmed = command.replace(/\s/g, ''); // Trim all whitespace
  return trimmed;
}
