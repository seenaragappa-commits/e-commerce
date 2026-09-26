import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Package, PackageSearch } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import PageTitle from '../components/PageTitle';
import ProductImage from '../components/ProductImage';
import { PageLoader } from '../components/Spinner';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadges';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useFetch from '../hooks/useFetch';
import { getMyOrders } from '../services/orderService';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { formatDate, formatPrice, pluralize } from '../utils/format';
import { getOrderProgress, getTrackingMessage, isFinalStatus } from '../utils/orderHelpers';

const TABS = [
  { key: 'all', label: 'All orders', match: () => true },
  { key: 'active', label: 'In progress', match: (order) => !['Delivered', 'Cancelled'].includes(order.orderStatus) },
  { key: 'delivered', label: 'Delivered', match: (order) => order.orderStatus === 'Delivered' },
  { key: 'cancelled', label: 'Cancelled', match: (order) => order.orderStatus === 'Cancelled' },
];

function OrderCard({ order }) {
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const progress = getOrderProgress(order);
  const cancelled = order.orderStatus === 'Cancelled';
  const delivered = order.orderStatus === 'Delivered';

  return (
    <article className="card overflow-hidden transition hover:shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div>
            <p className="text-xs text-slate-500">Order number</p>
            <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Placed on</p>
            <p className="font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-semibold text-slate-900">{formatPrice(order.totalPrice)}</p>
          </div>
        </div>
        <OrderStatusBadge status={order.orderStatus} className="self-start sm:self-auto" />
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 -space-x-3">
            {order.orderItems.slice(0, 3).map((item) => (
              <ProductImage
                key={item.product}
                src={item.image}
                alt={item.name}
                className="h-14 w-14 rounded-xl border-2 border-white bg-gradient-to-b from-slate-50 to-slate-100 object-cover shadow-sm"
              />
            ))}
            {order.orderItems.length > 3 && (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-bold text-slate-600">
                +{order.orderItems.length - 3}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {order.orderItems[0]?.name}
              {order.orderItems.length > 1 && ` and ${pluralize(order.orderItems.length - 1, 'more item')}`}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {pluralize(itemCount, 'unit')} - {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              <PaymentStatusBadge status={order.paymentStatus} />
            </p>
          </div>
        </div>

        <Link to={`/orders/${order._id}`} className="btn btn-secondary">
          <PackageSearch className="h-4 w-4" aria-hidden="true" />
          {cancelled || delivered ? 'View details' : 'Track order'}
        </Link>
      </div>

      <div className="px-5 pb-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div
            className={`h-full rounded-full ${cancelled ? 'bg-red-400' : delivered ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{getTrackingMessage(order)}</p>
      </div>
    </article>
  );
}

export default function MyOrdersPage() {
  const { data: orders, loading, error, reload, setData } = useFetch(getMyOrders, 'my-orders');
  const [activeTab, setActiveTab] = useState('all');

  // Keep the statuses up to date while any order is still on its way.
  useAutoRefresh(
    () =>
      getMyOrders()
        .then(setData)
        .catch(() => {}),
    { enabled: Boolean(orders?.some((order) => !isFinalStatus(order.orderStatus))), interval: 30000 },
  );

  if (loading && !orders) return <PageLoader label="Loading your orders..." />;

  const allOrders = orders ?? [];
  const tab = TABS.find((item) => item.key === activeTab) ?? TABS[0];
  const visibleOrders = allOrders.filter(tab.match);

  let content;
  if (error) {
    content = <ErrorState message={error} onRetry={reload} />;
  } else if (allOrders.length === 0) {
    content = (
      <EmptyState
        icon={Package}
        title="No orders yet"
        message="When you place an order, it will appear here so you can track it."
        action={
          <Link to="/products" className="btn btn-primary">
            Start shopping
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
    );
  } else if (visibleOrders.length === 0) {
    content = <EmptyState icon={Package} title={`No ${tab.label.toLowerCase()}`} message="Try another tab to see your other orders." />;
  } else {
    content = (
      <div className="space-y-4">
        {visibleOrders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageTitle title="My Orders" />
      <div className="container-page max-w-5xl py-8 sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">My Orders</h1>
        <p className="mt-2 text-sm text-slate-500">Track, review and manage your orders.</p>

        {allOrders.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter orders">
            {TABS.map((item) => {
              const count = allOrders.filter(item.match).length;
              const selected = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  <span className={`rounded-full px-1.5 text-xs ${selected ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">{content}</div>
      </div>
    </>
  );
}
