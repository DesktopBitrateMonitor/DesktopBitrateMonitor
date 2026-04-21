/**
 * Utility functions for merging store configurations
 */

const isArray = (value) => Array.isArray(value);

export function isSameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Merges existing items with defaults while preserving user customizations
 * @param {Array} existingList - User's existing items
 * @param {Array} defaultList - Default items
 * @param {Function} getKey - Function to extract merge key from item
 * @returns {Array} Merged items
 */
export const mergeByKey = (existingList, defaultList, getKey) => {
  const existing = isArray(existingList) ? existingList : [];
  const defaults = isArray(defaultList) ? defaultList : [];

  const defaultByKey = new Map();
  for (const item of defaults) {
    const key = getKey(item);
    if (key) defaultByKey.set(key, item);
  }

  const existingByKey = new Map();
  for (const item of existing) {
    const key = getKey(item);
    if (!key || existingByKey.has(key)) continue;
    existingByKey.set(key, item);
  }

  const merged = [];

  // Ensure merged entries follow the exact default order.
  for (const defaultItem of defaults) {
    const key = getKey(defaultItem);
    if (!key) {
      merged.push(defaultItem);
      continue;
    }

    const existingItem = existingByKey.get(key);
    if (existingItem) {
      // Keep user customizations while filling any newly added default fields.
      merged.push({ ...defaultItem, ...existingItem });
      continue;
    }

    merged.push(defaultItem);
  }

  // Keep deprecated/custom entries already present in the user's store.
  for (const item of existing) {
    const key = getKey(item);
    if (!key || !defaultByKey.has(key)) {
      merged.push(item);
    }
  }

  return merged;
};

/**
 * Extracts merge key from a command
 * @param {Object} command - Command object
 * @returns {string|null} Merge key or null if invalid
 */
export const getCommandMergeKey = (command) => {
  if (!command || !command.action) return null;
  return `${command.action}`;
};

/**
 * Extracts merge key from a message
 * @param {Object} message - Message object
 * @returns {string|null} Merge key or null if invalid
 */
export const getMessageMergeKey = (message) => {
  if (!message || !message.action || !message.event) return null;
  return `${message.group || ''}:${message.action}:${message.event}`;
};
