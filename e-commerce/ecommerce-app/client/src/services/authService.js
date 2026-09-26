import api from './api';

/** @returns {Promise<{ user, token }>} */
export const register = async ({ name, email, password, confirmPassword }) => {
  const { data } = await api.post('/auth/register', { name, email, password, confirmPassword });
  return data;
};

/** @returns {Promise<{ user, token }>} */
export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

/** The currently logged-in user (validates the stored token). */
export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

/** Update name/email and/or password. */
export const updateProfile = async (changes) => {
  const { data } = await api.put('/auth/profile', changes);
  return data.user;
};
