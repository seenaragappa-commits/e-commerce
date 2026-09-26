import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';
import { readString, removeItem, writeString } from '../utils/storage';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

/**
 * Keeps track of the logged-in user.
 * The JWT is stored in localStorage and sent with every API request (see services/api.js).
 * Note: `isAdmin` only controls what the UI shows - the server checks the real role on every request.
 */
export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  // Only "loading" when there is a saved token that still has to be verified.
  const [loading, setLoading] = useState(() => Boolean(readString(STORAGE_KEYS.token)));

  // On page load, verify the saved token by asking the server who we are.
  useEffect(() => {
    if (!readString(STORAGE_KEYS.token)) return undefined;

    let ignore = false;
    authService
      .getMe()
      .then((currentUser) => {
        if (!ignore) setUser(currentUser);
      })
      .catch((error) => {
        // Only forget the token if the server rejected it (not when the server is offline).
        if (!ignore && error.response?.status === 401) removeItem(STORAGE_KEYS.token);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const saveSession = useCallback(({ user: loggedInUser, token }) => {
    writeString(STORAGE_KEYS.token, token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const login = useCallback(
    async (credentials) => saveSession(await authService.login(credentials)),
    [saveSession],
  );

  const register = useCallback(
    async (details) => saveSession(await authService.register(details)),
    [saveSession],
  );

  const logout = useCallback(() => {
    removeItem(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const updatedUser = await authService.updateProfile(changes);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  // services/api.js fires this event when the server answers 401 (expired/invalid token).
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      toast.info('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, toast]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, loading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
