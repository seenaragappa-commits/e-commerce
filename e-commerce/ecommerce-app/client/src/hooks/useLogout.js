import { startTransition, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Logs the user out and leaves the current page in ONE transition.
 *
 * React Router applies navigations inside a transition. If `logout()` ran on its own, the
 * protected page would first re-render without a user and redirect to /login ("Please log
 * in to continue") before the navigation to `to` could happen.
 *
 *   const logOut = useLogout();
 *   logOut();                                   // -> home page
 *   logOut({ to: '/login', state, message });   // -> somewhere else
 */
export default function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  return useCallback(
    ({ to = '/', state, message = 'You have been logged out. See you soon!' } = {}) => {
      startTransition(() => {
        logout();
        navigate(to, { replace: true, state });
      });
      if (message) toast.success(message);
    },
    [logout, navigate, toast],
  );
}
