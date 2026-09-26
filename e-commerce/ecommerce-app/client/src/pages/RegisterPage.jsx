import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { CircleAlert, Mail, UserRound } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PageTitle from '../components/PageTitle';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../utils/getErrorMessage';
import { getPasswordStrength, validateRegister } from '../utils/validation';

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

function PasswordStrength({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`h-1.5 flex-1 rounded-full transition ${level <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Password strength: <span className="font-semibold text-slate-700">{STRENGTH_LABELS[strength]}</span>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const redirectTo = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateRegister(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const newUser = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success(`Welcome to ShopSphere, ${newUser.name.split(' ')[0]}! Your account is ready.`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle title="Create account" />
      <AuthLayout title="Create your account" subtitle="Join ShopSphere to shop faster and track every order.">
        {serverError && (
          <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <InputField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Alex Johnson"
            icon={UserRound}
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
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
          <div>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              hint="Use at least 6 characters with a letter and a number."
            />
            <PasswordStrength password={form.password} />
          </div>
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}
