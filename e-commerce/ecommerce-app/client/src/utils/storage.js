// Small wrappers around localStorage that never crash the app
// (localStorage can be unavailable in private mode or contain bad JSON).

export const readJSON = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked - the app keeps working without persistence.
  }
};

export const readString = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeString = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};
