import crypto from 'node:crypto';

// No 0/O or 1/I so order numbers are easy to read out loud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const pad = (value) => String(value).padStart(2, '0');

/**
 * Creates a human-friendly order number such as "SS-260925-K7Q4M"
 * (prefix - date as YYMMDD - 5 random characters).
 */
const generateOrderNumber = (date = new Date()) => {
  const datePart = `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

  let randomPart = '';
  for (const byte of crypto.randomBytes(5)) {
    randomPart += ALPHABET[byte % ALPHABET.length];
  }

  return `SS-${datePart}-${randomPart}`;
};

export default generateOrderNumber;
