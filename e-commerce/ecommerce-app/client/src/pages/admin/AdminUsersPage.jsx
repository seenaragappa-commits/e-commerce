import { useState } from 'react';
import { Search, ShieldCheck, ShoppingBag, UserPlus, Users } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageTitle from '../../components/PageTitle';
import { PageLoader } from '../../components/Spinner';
import useFetch from '../../hooks/useFetch';
import { getUsers } from '../../services/adminService';
import { formatDate, formatPrice, getInitials, pluralize } from '../../utils/format';

const DAY_MS = 24 * 60 * 60 * 1000;

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Customers' },
  { value: 'admin', label: 'Admins' },
];

const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  name: { label: 'Name: A to Z', compare: (a, b) => a.name.localeCompare(b.name) },
  orders: { label: 'Most orders', compare: (a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent },
  spent: { label: 'Highest spend', compare: (a, b) => b.totalSpent - a.totalSpent },
};

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-600/15">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Admin
    </span>
  ) : (
    <span className="badge bg-slate-100 text-slate-700 ring-1 ring-slate-500/15">Customer</span>
  );
}

function Avatar({ name }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
      {getInitials(name)}
    </span>
  );
}

export default function AdminUsersPage() {
  const { data: users, loading, error, reload } = useFetch(getUsers, 'admin-users');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState('newest');
  // The time the page was opened, used for "joined in the last 30 days".
  const [openedAt] = useState(() => Date.now());

  if (loading && !users) return <PageLoader label="Loading customers..." />;
  if (error && !users) return <ErrorState message={error} onRetry={reload} />;

  const customers = users.filter((user) => user.role === 'user');
  const admins = users.length - customers.length;
  const newCustomers = customers.filter((user) => openedAt - new Date(user.createdAt).getTime() <= 30 * DAY_MS).length;
  const buyers = customers.filter((user) => user.orderCount > 0).length;

  const search = query.trim().toLowerCase();
  const visibleUsers = users
    .filter((user) => !role || user.role === role)
    .filter((user) => !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search))
    .sort(SORTS[sort].compare);

  return (
    <div className="space-y-6">
      <PageTitle title="Customers" />
      <AdminPageHeader title="Customers" description={`${pluralize(users.length, 'registered account')} - passwords are never shown`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Customers" value={customers.length} detail="Accounts with the customer role" color="bg-blue-50 text-blue-600" />
        <StatCard icon={ShoppingBag} label="Customers with orders" value={buyers} detail={`${customers.length ? Math.round((buyers / customers.length) * 100) : 0}% have ordered`} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={UserPlus} label="New customers" value={newCustomers} detail="Joined in the last 30 days" color="bg-violet-50 text-violet-600" />
        <StatCard icon={ShieldCheck} label="Administrators" value={admins} detail="Can manage the store" color="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="admin-user-search" className="sr-only">
            Search customers
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="admin-user-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email..."
            className="input pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <label htmlFor="admin-role-filter" className="sr-only">
            Filter by role
          </label>
          <select id="admin-role-filter" value={role} onChange={(event) => setRole(event.target.value)} className="input cursor-pointer sm:w-40">
            {ROLE_FILTERS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label htmlFor="admin-user-sort" className="sr-only">
            Sort customers
          </label>
          <select id="admin-user-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="input cursor-pointer sm:w-44">
            {Object.entries(SORTS).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts found"
          message="Try a different name, email or role."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRole('');
              }}
              className="btn btn-secondary"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          {/* Table on wide screens (1280px+) */}
          <div className="card hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Registered</th>
                  <th className="px-3 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Total spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">
                            {user.lastOrderAt ? `Last order ${formatDate(user.lastOrderAt)}` : 'No orders yet'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-64 truncate px-3 py-3 text-slate-600">{user.email}</td>
                    <td className="px-3 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3 text-right text-slate-900 tabular-nums">{user.orderCount}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatPrice(user.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on phones, tablets and small laptops (two columns from 768px) */}
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
            {visibleUsers.map((user) => (
              <li key={user._id} className="card flex items-start gap-3 p-4">
                <Avatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <p className="mt-1.5 text-xs text-slate-500">Registered {formatDate(user.createdAt)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {pluralize(user.orderCount, 'order')} - {formatPrice(user.totalSpent)} spent
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
