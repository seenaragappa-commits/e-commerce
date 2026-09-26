import ApiError from '../utils/ApiError.js';

// Protection against password guessing ("brute force"): after MAX_FAILED_ATTEMPTS
// wrong passwords for the same email from the same IP address, logging in to that
// email is refused for LOCK_MINUTES. A successful login resets the counter.
// The counters live in memory, so they also reset when the server restarts.
const MAX_FAILED_ATTEMPTS = 10;
const LOCK_MINUTES = 15;
const WINDOW_MS = LOCK_MINUTES * 60 * 1000;

const failedAttempts = new Map(); // "ip|email" -> { count, firstAt }

const keyFor = (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${req.ip}|${email}`;
};

/** The counter for this key, or undefined if there is none (or it has expired). */
const currentEntry = (key) => {
  const entry = failedAttempts.get(key);
  if (entry && Date.now() - entry.firstAt > WINDOW_MS) {
    failedAttempts.delete(key);
    return undefined;
  }
  return entry;
};

/** Middleware for POST /api/auth/login: answers 429 while this email/IP is locked. */
export const checkLoginAttempts = (req, _res, next) => {
  const entry = currentEntry(keyFor(req));
  if (entry && entry.count >= MAX_FAILED_ATTEMPTS) {
    const minutesLeft = Math.max(1, Math.ceil((entry.firstAt + WINDOW_MS - Date.now()) / 60000));
    throw new ApiError(429, `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`);
  }
  next();
};

export const recordFailedLogin = (req) => {
  const key = keyFor(req);
  const entry = currentEntry(key);
  if (entry) entry.count += 1;
  else failedAttempts.set(key, { count: 1, firstAt: Date.now() });

  // Forget expired counters now and then, so the map cannot grow forever.
  if (failedAttempts.size > 10000) {
    for (const [oldKey, oldEntry] of failedAttempts) {
      if (Date.now() - oldEntry.firstAt > WINDOW_MS) failedAttempts.delete(oldKey);
    }
  }
};

export const clearFailedLogins = (req) => {
  failedAttempts.delete(keyFor(req));
};
