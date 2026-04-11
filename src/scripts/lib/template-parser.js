/**
 *
 * @param {string} template - String with with the ${key}
 * @param {object} obj - Object with the keys and values {key: value}
 * - Multiple and nested keys possible {key.nest: value, key: value}
 * @returns {string} Parsed String
 */

export function templateParser(template, obj = {}) {
  if (typeof template !== 'string') return template;

  const replaceTokens = (str, regex) =>
    str.replace(regex, (match, key) => {
      const value = getNestedValue(obj, key.trim());
      return value !== undefined ? value : match;
    });

  // Support both ${key} and {{key}} placeholders for flexibility across renderers.
  const withDollar = replaceTokens(template, /\$\{(.*?)\}/g);
  return replaceTokens(withDollar, /\{\{(.*?)\}\}/g);
}

function getNestedValue(obj, path) {
  // Split the path by dots and traverse the object
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}
