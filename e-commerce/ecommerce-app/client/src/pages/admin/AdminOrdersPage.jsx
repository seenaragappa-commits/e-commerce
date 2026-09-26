import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, ClipboardList, Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageTitle from '../../components/PageTitle';
import Pagination from '../../components/Pagination';
import { PageLoader } from '../../components/Spinner';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadges';
import useFetch from '../../hooks/useFetch';
import { getOrders } from '../../services/adminService';
import { ORDER_STATUSES, PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { formatDate, formatPrice, pluralize } from '../../utils/format';
import { currentSearchParams, withChanges } from '../../utils/searchParams';

const PAGE_SIZE = 10;
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Cancelled'];

/** "Order Placed,Confirmed" -> ['Order Placed', 'Confirmed'] (unknown values are ignored). */
const parseStatuses = (value) => (value ?? '').split(',').filter((status) => ORDER_STATUSES.includes(status));

function OrderSearch({ initialValue, onSearch }) {
  const [query, setQuery] = useState(initialValue);

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
    >
      <label htmlFor="admin-order-search" className="sr-only">
        Search orders
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id="admin-order-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Order ID, customer name or email..."
        className="input pl-10"
      />
    </form>
  );
}

const itemCount = (order) => order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
const customerName = (order) => order.user?.name ?? order.shippingAddress.fullName;
const customerEmail = (order) => order.user?.email ?? order.shippingAddress.email;

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?status= holds one status or a comma-separated list (the dashboard links to e.g. "Order Placed,Confirmed").
  const selectedStatuses = parseStatuses(searchParams.get('status'));
  const paymentStatus = searchParams.get('paymentStatus') ?? '';
  const keyword = searchParams.get('keyword') ?? '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);

  const { data, loading, error, reload } = useFetch(
    () => getOrders({ status: selectedStatuses.join(','), paymentStatus, keyword, page, limit: PAGE_SIZE }),
    `admin-orders?${searchParams.toString()}`,
  );

  const updateParams = (changes) => setSearchParams(withChanges(changes));

  // Status chips work as toggles; "All orders" clears them.
  const toggleStatus = (status) => {
    const current = parseStatuses(currentSearchParams().get('status'));
    const next = current.includes(status)
      ? current.filter((item) => item !== status)
      : ORDER_STATUSES.filter((item) => item === status || current.includes(item));
    updateParams({ status: next.join(',') });
  };

  if (loading && !data) return <PageLoader label="Loading orders..." />;

  const orders = data?.orders ?? [];
  const hasFilters = Boolean(selectedStatuses.length || paymentStatus || keyword);

  let content;
  if (error) {
    content = <ErrorState message={error} onRetry={reload} />;
  } else if (orders.length === 0) {
    content = (
      <EmptyState
        icon={ClipboardList}
        title="No orders found"
        message={hasFilters ? 'Try another status, payment status or search term.' : 'Orders will appear here as soon as customers check out.'}
        action={
          hasFilters && (
            <button type="button" onClick={() => setSearchParams(new URLSearchParams())} className="btn btn-secondary">
              Clear filters
            </button>
          )
        }
      />
    );
  } else {
    content = (
      <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {/* Table on wide screens (1280px+) */}
        <div className="card hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3 text-right">Items</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3">Payment status</th>
                <th className="px-3 py-3">Order status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${order._id}`} className="font-mono text-xs font-bold whitespace-nowrap text-blue-700 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="max-w-56 px-3 py-3">
                    <p className="truncate font-medium text-slate-900">{customerName(order)}</p>
                    <p className="truncate text-xs text-slate-500">{customerEmail(order)}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(order.createdAt)}</td>
                  <td className="px-3 py-3 text-right text-slate-700 tabular-nums">{itemCount(order)}</td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">{formatPrice(order.totalPrice)}</td>
                  <td className="px-3 py-3">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <p className="mt-1 text-xs whitespace-nowrap text-slate-500">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                  </td>
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/admin/orders/${order._id}`} className="btn btn-secondary btn-sm" aria-label={`Manage order ${order.orderNumber}`}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards on phones, tablets and small laptops (two columns from 768px) */}
        <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
          {orders.map((order) => (
            <li key={order._id}>
              <Link to={`/admin/orders/${order._id}`} className="card block p-4 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(order.createdAt)} - {customerName(order)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.orderStatus} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="ml-auto text-right">
                    <span className="block text-sm font-bold text-slate-900">{formatPrice(order.totalPrice)}</span>
                    <span className="block text-xs text-slate-500">{pluralize(itemCount(order), 'item')}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Pagination page={data.page} pages={data.pages} onPageChange={(nextPage) => updateParams({ page: nextPage })} />
      </div>
    );
  }

  const statusSummary = selectedStatuses.length ? ` with status ${selectedStatuses.map((status) => `"${status}"`).join(' or ')}` : '';

  return (
    <div className="space-y-6">
      <PageTitle title="Manage orders" />
      <AdminPageHeader
        title="Orders"
        description={data ? `${pluralize(data.total, 'order')}${statusSummary}` : 'Track and update customer orders'}
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <OrderSearch key={keyword} initialValue={keyword} onSearch={(value) => updateParams({ keyword: value })} />
          <label htmlFor="admin-payment-filter" className="sr-only">
            Filter by payment status
          </label>
          <select
            id="admin-payment-filter"
            value={paymentStatus}
            onChange={(event) => updateParams({ paymentStatus: event.target.value })}
            className="input cursor-pointer sm:w-56"
          >
            <option value="">All payment statuses</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                Payment: {status}
              </option>
            ))}
          </select>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by order status">
          <button
            type="button"
            onClick={() => updateParams({ status: '' })}
            aria-pressed={selectedStatuses.length === 0}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              selectedStatuses.length === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            All orders
          </button>
          {ORDER_STATUSES.map((status) => {
            const selected = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  selected ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {content}
    </div>
  );
}
