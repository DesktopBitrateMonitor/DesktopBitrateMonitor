export function readJsonData({ lng, fallbackLng, key, fallbackValue = null }) {
  if (!key) {
    console.error('Key is required to read JSON data.');
    return fallbackValue;
  }

  const resolvePath = (source) =>
    key
      .split('.')
      .reduce(
        (acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined),
        source
      );

  const resolved = resolvePath(lng);
  if (resolved !== undefined && resolved !== null) {
    return resolved;
  }

  const fallbackResolved = resolvePath(fallbackLng);
  if (fallbackResolved !== undefined && fallbackResolved !== null) {
    return fallbackResolved;
  }

  if (fallbackValue !== null && fallbackValue !== undefined) {
    return fallbackValue;
  }

  console.error(`Key "${key}" not found in provided language data.`);
  return null;
}
