import mongoose from 'mongoose';

/** Rounds a money value to 2 decimal places (avoids 0.1 + 0.2 style errors). */
export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Escapes user text so it can be used safely inside a RegExp (prevents regex injection). */
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Returns the value only if it is a string, otherwise an empty string. */
export const asString = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Looks up a key in a plain options object, ignoring inherited keys
 * (so ?sort=constructor cannot reach Object.prototype).
 */
export const pickOption = (options, key) => (Object.hasOwn(options, key) ? options[key] : undefined);

/** Parses a positive integer query parameter and keeps it within [min, max]. */
export const toBoundedInt = (value, fallback, min, max) => {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.min(Math.max(number, min), max);
};

/** True for a 24-character hex MongoDB ObjectId string. */
export const isObjectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && mongoose.isValidObjectId(value);

/** The calendar date ("2026-09-25") of a moment in the given IANA time zone (e.g. "Asia/Kolkata"). */
export const toDateKey = (date, timeZone = 'UTC') => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/**
 * The last `count` calendar dates in `timeZone`, ending with today, oldest first.
 * It steps back by calendar days instead of 24-hour blocks, so no day is skipped or
 * repeated when the clocks change for daylight saving time (23- or 25-hour days).
 */
export const lastCalendarDays = (now, timeZone, count) => {
  const [year, month, day] = toDateKey(now, timeZone).split('-').map(Number);
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(year, month - 1, day - (count - 1 - index))).toISOString().slice(0, 10),
  );
};

/** Adds whole days to a date and returns a new Date. */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
