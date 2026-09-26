import { CalendarDays, Mail, ShieldCheck } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { PasswordForm, ProfileForm } from '../../components/AccountForms';
import PageTitle from '../../components/PageTitle';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, getInitials } from '../../utils/format';
import { getErrorMessage } from '../../utils/getErrorMessage';

/** The admin's own account: name, email and password. */
export default function AdminProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const saveChanges = async (changes, successMessage) => {
    try {
      await updateProfile(changes);
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Admin profile" />
      <AdminPageHeader title="Profile" description="Manage your administrator account." />

      <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-extrabold text-white shadow-md">
          {getInitials(user.name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-600/15">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Administrator
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {user.email}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Admin since {formatDate(user.createdAt)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* The key resets the form after a successful save. */}
        <ProfileForm key={`${user.name}|${user.email}`} user={user} onSave={saveChanges} />
        <PasswordForm onSave={saveChanges} />
      </div>

      <p className="text-xs text-slate-500">
        Roles cannot be changed from the app. New accounts are always customers; administrator accounts are created by the
        seed script.
      </p>
    </div>
  );
}
