import { Link } from 'react-router';
import { CalendarDays, LayoutDashboard, LogOut, Package, ShieldCheck, ShoppingBag, UserRound, Wallet } from 'lucide-react';
import { PasswordForm, ProfileForm } from '../components/AccountForms';
import PageTitle from '../components/PageTitle';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useLogout from '../hooks/useLogout';
import { getMyOrders } from '../services/orderService';
import { formatDate, formatPrice, getInitials } from '../utils/format';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function ProfilePage() {
  const { user, isAdmin, updateProfile } = useAuth();
  const toast = useToast();
  const logOut = useLogout();
  const { data: orders } = useFetch(getMyOrders, 'my-orders');

  const orderList = orders ?? [];
  const totalSpent = orderList.filter((order) => order.orderStatus !== 'Cancelled').reduce((sum, order) => sum + order.totalPrice, 0);
  const activeOrders = orderList.filter((order) => !['Delivered', 'Cancelled'].includes(order.orderStatus)).length;

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
    <>
      <PageTitle title="My Profile" />
      <div className="container-page max-w-5xl py-8 sm:py-10">
        {/* Account header */}
        <section className="card overflow-hidden">
          <div aria-hidden="true" className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              {/* Only the avatar overlaps the banner; the text sits below it. */}
              <span className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-extrabold text-white shadow-lg ring-4 ring-white">
                {getInitials(user.name)}
              </span>
              <div className="sm:pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{user.name}</h1>
                  <span className={`badge ring-1 ${isAdmin ? 'bg-blue-50 text-blue-700 ring-blue-600/15' : 'bg-slate-100 text-slate-700 ring-slate-500/15'}`}>
                    {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <UserRound className="h-3.5 w-3.5" aria-hidden="true" />}
                    {isAdmin ? 'Administrator' : 'Customer'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-4">
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Admin dashboard
                </Link>
              )}
              <button type="button" onClick={() => logOut()} className="btn btn-danger-ghost ring-1 ring-red-200">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={ShoppingBag} label="Total orders" value={orders ? orderList.length : '-'} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Package} label="In progress" value={orders ? activeOrders : '-'} color="bg-amber-50 text-amber-600" />
          <StatCard icon={Wallet} label="Total spent" value={orders ? formatPrice(totalSpent) : '-'} color="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="mt-6 flex justify-end">
          <Link to="/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View my orders &rarr;
          </Link>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* The key resets the form after a successful save. */}
          <ProfileForm key={`${user.name}|${user.email}`} user={user} onSave={saveChanges} />
          <PasswordForm onSave={saveChanges} />
        </div>
      </div>
    </>
  );
}
