/**
 *
 * @param {string} template - String with with the ${key}
 * @param {object} obj - Object with the keys and values {key: value}
 * - Multiple and nested keys possible {key.nest: value, key: value}
 * @returns {string} Parsed String
 */

// TODO: Check the parser can handle templates in templates like ${variable1 ${variable2}}

export function templateParser(template, obj) {
  return template.replace(/\$\{(.*?)\}/g, (match, key) => {
    let value = getNestedValue(obj, key.trim());
    return value !== undefined ? value : match;
  });
}

function getNestedValue(obj, path) {
  // Split the path by dots and traverse the object
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}