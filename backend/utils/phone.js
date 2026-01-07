// Normalize Indian phone numbers to a fixed +91 prefix.
// Accepts numbers with/without +, spaces, or hyphens, and keeps the last 10 digits as the local number.
// Throws an error if fewer than 10 digits are provided.
const normalizeIndianPhone = (input) => {
  if (!input) throw new Error('Phone number is required');

  // Keep digits only
  const digits = (input.match(/\d+/g) || []).join('');

  if (digits.length < 10) {
    throw new Error('Phone number must have at least 10 digits');
  }

  // Use the last 10 digits as the local number
  const local10 = digits.slice(-10);

  return `+91${local10}`;
};

module.exports = { normalizeIndianPhone };


