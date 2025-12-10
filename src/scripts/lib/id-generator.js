export default function generateId() {
  // Generate a random alphanumeric ID of length 10
  return Math.random().toString(36).substr(2, 10);
}
