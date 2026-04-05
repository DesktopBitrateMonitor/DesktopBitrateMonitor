/**
 * @param {number} length - The length of the generated ID (default is 10)
 * @returns {string} A random alphanumeric ID
 */

export default function generateId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values, (value) => chars[value % chars.length]).join('');
}
