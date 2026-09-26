import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, CreditCard, History, MapPin, PackageCheck, RefreshCw, Truck, XCircle } from 'lucide-react';
import AddressBlock from '../components/AddressBlock';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorState from '../components/ErrorState';
import InfoCard from '../components/InfoCard';
import OrderTimeline from '../components/OrderTimeline';
import PageTitle from '../components/PageTitle';
import PriceSummary from '../components/PriceSummary';
import ProductImage from '../components/ProductImage';
import { PageLoader } from '../components/Spinner';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadges';
import StatusHistory from '../components/StatusHistory';
import { useToast } from '../context/ToastContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useFetch from '../hooks/useFetch';
import { cancelOrder, getOrder } from '../services/orderService';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { formatDateTime, formatPrice, formatShortDate } from '../utils/format';
import { getErrorMessage } from '../utils/getErrorMessage';
import { canCustomerCancel, getTrackingMessage, isFinalStatus } from '../utils/orderHelpers';

// How often an order that is still on its way is re-loaded from the server.
const TRACKING_REFRESH_MS = 15000;

export default function OrderDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload, setData } = useFetch(() => getOrder(id), `order:${id}`);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Bumped whenever the order changes here, so a background refresh that started earlier can't overwrite it.
  const changeCounter = useRef(0);

  // Live tracking: the status comes from MongoDB, so re-load it while the order is still on its way.
  // An admin's update (e.g. Processing -> Shipped) then appears within seconds.
  useAutoRefresh(
    async () => {
      const startedAt = changeCounter.current;
      try {
        const fresh = await getOrder(id);
        if (startedAt !== changeCounter.current) return;
        if (fresh.orderStatus !== order.orderStatus) toast.info(`Order update: your order is now "${fresh.orderStatus}"`);
        setData(fresh);
      } catch {
        // Keep showing the last known status; the next refresh will try again.
      }
    },
    { enabled: Boolean(order) && !isFinalStatus(order.orderStatus), interval: TRACKING_REFRESH_MS },
  );

  if (loading && !order) return <PageLoader label="Loading order details..." />;
  if (error && !order) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Order not available" message={error} onRetry={reload} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to my orders
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const cancelled = order.orderStatus === 'Cancelled';
  const delivered = order.orderStatus === 'Delivered';

  const handleCancel = async () => {
    setCancelling(true);
    changeCounter.current += 1;
    try {
      const updated = await cancelOrder(order._id);
      setData(updated);
      setConfirmOpen(false);
      toast.success('Your order has been cancelled');
    } catch (cancelError) {
      toast.error(getErrorMessage(cancelError));
      setConfirmOpen(false);
      reload();
    } finally {
      // Also ignore a background refresh that started while the cancel request was running.
      changeCounter.current += 1;
      setCancelling(false);
    }
  };

  let bannerStyle = 'bg-blue-50 text-blue-800 ring-blue-600/10';
  let BannerIcon = Truck;
  if (delivered) {
    bannerStyle = 'bg-emerald-50 text-emerald-800 ring-emerald-600/15';
    BannerIcon = PackageCheck;
  } else if (cancelled) {
    bannerStyle = 'bg-red-50 text-red-800 ring-red-600/15';
    BannerIcon = XCircle;
  }

  return (
    <>
      <PageTitle title={`Order ${order.orderNumber}`} />
      <div className="container-page py-8 sm:py-10">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to my orders
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.orderStatus} className="text-sm" />
            </div>
            <p className="mt-1.5 text-sm text-slate-500">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={reload} className="btn btn-secondary" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            {canCustomerCancel(order) && (
              <button type="button" onClick={() => setConfirmOpen(true)} className="btn btn-danger-ghost ring-1 ring-red-200">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel order
              </button>
            )}
          </div>
        </div>

        {/* Tracking */}
        <section className="card mt-6 p-5 sm:p-8" aria-labelledby="tracking-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="tracking-heading" className="text-lg font-bold text-slate-900">
                Order tracking
              </h2>
              {!cancelled && !delivered && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/15"
                  title="This page checks for status updates automatically"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live updates
                </span>
              )}
            </div>
            {!cancelled && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span className="whitespace-nowrap">{delivered ? 'Delivered on' : 'Estimated delivery:'}</span>
                <span className="font-semibold whitespace-nowrap text-slate-900">
                  {formatShortDate(delivered ? (order.deliveredAt ?? order.updatedAt) : order.estimatedDelivery)}
                </span>
              </p>
            )}
          </div>

          <div className={`mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${bannerStyle}`}>
            <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            {getTrackingMessage(order)}
          </div>

          <div className="mt-8">
            <OrderTimeline order={order} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card p-5 sm:p-6" aria-labelledby="items-heading">
              <h2 id="items-heading" className="text-base font-bold text-slate-900">
                Items ({itemCount})
              </h2>
              <ul className="mt-2 divide-y divide-slate-100">
                {order.orderItems.map((item) => (
                  <li key={item.product} className="flex items-center gap-4 py-4">
                    <Link to={`/products/${item.product}`} className="shrink-0">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70 sm:h-20 sm:w-20"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.product}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600">
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <InfoCard icon={History} title="Order activity">
              <StatusHistory history={order.statusHistory} />
            </InfoCard>
          </div>

          <div className="space-y-6">
            <InfoCard icon={CreditCard} title="Payment">
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Method</dt>
                  <dd className="font-semibold text-slate-900">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </dd>
                </div>
                {order.paidAt && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Paid on</dt>
                    <dd className="font-semibold text-slate-900">{formatShortDate(order.paidAt)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <PriceSummary itemCount={itemCount} subtotal={order.itemsPrice} shipping={order.shippingPrice} total={order.totalPrice} />
              </div>
            </InfoCard>

            <InfoCard icon={MapPin} title="Shipping address">
              <AddressBlock address={order.shippingAddress} showPhone showEmail />
            </InfoCard>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        message={`Order ${order.orderNumber} will be cancelled and the items returned to stock.${
          order.paymentStatus === 'Paid' ? ' Your demo payment will be marked as refunded.' : ''
        } This cannot be undone.`}
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
