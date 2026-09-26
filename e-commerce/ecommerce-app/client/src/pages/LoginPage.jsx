import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { CircleAlert, Mail, ShieldCheck, UserRound } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PageTitle from '../components/PageTitle';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import { validateLogin } from '../utils/validation';

const DEMO_ACCOUNTS = [
  { label: 'Customer demo', email: 'user@example.com', password: 'User@123', icon: UserRound },
  { label: 'Admin demo', email: 'admin@example.com', password: 'Admin@123', icon: ShieldCheck },
];

/** Where to go after logging in: back to the protected page the user tried to open, if any. */
const getRedirectPath = (location, user) => {
  const from = location.state?.from;
  if (from?.pathname) return `${from.pathname}${from.search ?? ''}`;
  return user?.role === 'admin' ? '/admin' : '/';
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Skip the login page.
  if (user && !submitting) return <Navigate to={getRedirectPath(location, user)} replace />;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLogin(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const loggedInUser = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${loggedInUser.name.split(' ')[0]}!`);
      navigate(getRedirectPath(location, loggedInUser), { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
    setServerError('');
  };

  return (
    <>
      <PageTitle title="Log in" />
      <AuthLayout title="Welcome back" subtitle="Log in to track your orders and check out faster.">
        {location.state?.from && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            Please log in to continue.
          </div>
        )}

        {serverError && (
          <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <InputField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to ShopSphere?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Demo accounts</p>
          <p className="mt-1 text-xs text-slate-500">Click to fill in the login form.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                <account.icon className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{account.label}</span>
                  <span className="block truncate text-xs text-slate-500">{account.email}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
