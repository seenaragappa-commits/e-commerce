import { useState } from 'react';
import { KeyRound, Mail, UserRound } from 'lucide-react';
import InputField from './InputField';
import PasswordField from './PasswordField';
import { Spinner } from './Spinner';
import { getFieldErrors } from '../utils/getErrorMessage';
import { EMAIL_REGEX, validatePassword } from '../utils/validation';

// The "Personal information" and "Change password" forms, shared by the
// customer profile page (/profile) and the admin profile page (/admin/profile).
// `onSave(changes, successMessage)` must throw when saving fails.

/** Name + email. The `key` used by the parent resets the form after a successful save. */
export function ProfileForm({ user, onSave }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const unchanged = form.name.trim() === user.name && form.email.trim().toLowerCase() === user.email;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = {};
    if (form.name.trim().length < 2) validationErrors.name = 'Name must be at least 2 characters';
    if (!EMAIL_REGEX.test(form.email.trim())) validationErrors.email = 'Please enter a valid email address';
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave({ name: form.name.trim(), email: form.email.trim() }, 'Your profile has been updated');
    } catch (error) {
      setErrors(getFieldErrors(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <UserRound className="h-5 w-5 text-blue-600" aria-hidden="true" />
        Personal information
      </h2>
      <div className="mt-6 space-y-5">
        <InputField label="Full name" name="name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
        <InputField label="Email address" name="email" type="email" autoComplete="email" icon={Mail} value={form.email} onChange={handleChange} error={errors.email} />
      </div>
      <button type="submit" className="btn btn-primary mt-6" disabled={saving || unchanged}>
        {saving && <Spinner className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
}

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function PasswordForm({ onSave }) {
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = {};
    if (!form.currentPassword) validationErrors.currentPassword = 'Please enter your current password';
    const passwordError = validatePassword(form.newPassword);
    if (passwordError) validationErrors.newPassword = passwordError;
    if (form.newPassword !== form.confirmPassword) validationErrors.confirmPassword = 'Passwords do not match';
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave(form, 'Your password has been changed');
      setForm(EMPTY_PASSWORD_FORM);
    } catch (error) {
      setErrors(getFieldErrors(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <KeyRound className="h-5 w-5 text-blue-600" aria-hidden="true" />
        Change password
      </h2>
      <div className="mt-6 space-y-5">
        <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" value={form.currentPassword} onChange={handleChange} error={errors.currentPassword} />
        <PasswordField label="New password" name="newPassword" autoComplete="new-password" value={form.newPassword} onChange={handleChange} error={errors.newPassword} hint="At least 6 characters with a letter and a number." />
        <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
      </div>
      <button type="submit" className="btn btn-primary mt-6" disabled={saving}>
        {saving && <Spinner className="h-4 w-4" />}
        Update password
      </button>
    </form>
  );
}
