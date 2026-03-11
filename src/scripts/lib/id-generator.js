/**
 * @param {number} length - The length of the generated ID (default is 10)
 * @returns {string} A random alphanumeric ID
 */

export default function generateId(length = 10) {
  // Generate a random alphanumeric ID of specified length
  return Math.random().toString(36).substr(2, length);
}
