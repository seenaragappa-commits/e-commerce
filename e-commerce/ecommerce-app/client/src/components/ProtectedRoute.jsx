import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { LogIn, ShieldAlert, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useLogout from '../hooks/useLogout';
import { PageLoader } from './Spinner';
import Logo from './Logo';
import PageTitle from './PageTitle';

/** Shown to logged-in customers who open an admin URL. */
function AdminsOnly({ user }) {
  const logOut = useLogout();
  const location = useLocation();

  // Log out, then come back to this admin page after logging in with an admin account.
  const switchAccount = () => logOut({ to: '/login', state: { from: location }, message: '' });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PageTitle title="Admins only" />
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="card w-full max-w-lg p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-bold tracking-widest text-red-600 uppercase">403 - Access denied</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Admins only</h1>
          <p className="mt-2 text-sm text-slate-500">
            You are logged in as <span className="font-semibold text-slate-700">{user.email}</span>, which is a customer account. The
            admin dashboard needs an administrator account.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn btn-primary">
              <Store className="h-4 w-4" aria-hidden="true" />
              Back to the store
            </Link>
            <button type="button" onClick={switchAccount} className="btn btn-secondary">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Log in as admin
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Wraps routes that need a logged-in user (and optionally the admin role).
 * This only protects the UI - the API checks the token and the role on every request.
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session..." />;

  if (!user) {
    // Remember where the user wanted to go, so we can send them back after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && user.role !== 'admin') return <AdminsOnly user={user} />;

  return <Outlet />;
}
