import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';
import { readString } from '../utils/storage';

// One Axios instance for the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach the JWT (if the user is logged in) to every request.
api.interceptors.request.use((config) => {
  const token = readString(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server says our token is no longer valid, tell the AuthContext to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest && readString(STORAGE_KEYS.token)) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Removes empty values so the URL stays clean (e.g. no "?keyword="). */
export const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

export default api;
