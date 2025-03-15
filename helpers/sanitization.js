export const sanitizeInput = (input) => {
  // Allow alphanumeric characters, spaces, and the characters 'æ', 'ø', 'å'
  return input.replace(/[^a-zA-Z0-9æøå\s]/g, '');
};
