module.exports = async function extractUniqueRoles(text) {
  const regex = /<@&(\d+)>/g;

  const uniqueIDs = new Set();

  let match;
  while ((match = regex.exec(text)) !== null) {
    uniqueIDs.add(match[1]); // match[1] to ID (liczba)
  }

  return [...uniqueIDs];
};
