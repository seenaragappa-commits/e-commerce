import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CreditCard,
  History,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react';
import AddressBlock from '../../components/AddressBlock';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorState from '../../components/ErrorState';
import InfoCard from '../../components/InfoCard';
import InputField from '../../components/InputField';
import OrderTimeline from '../../components/OrderTimeline';
import PageTitle from '../../components/PageTitle';
import ProductImage from '../../components/ProductImage';
import { PageLoader, Spinner } from '../../components/Spinner';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadges';
import StatusHistory from '../../components/StatusHistory';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import { getOrder, updateOrderStatus } from '../../services/adminService';
import { PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime, formatPrice, formatShortDate, pluralize } from '../../utils/format';
import { getErrorMessage } from '../../utils/getErrorMessage';

/**
 * Lets the admin move the order to its next status, or cancel it.
 * The allowed statuses come from the API (order.allowedStatuses), so the rules live on the server:
 * one step forward at a time, cancel any time before delivery, Delivered/Cancelled are final.
 */
function StatusUpdatePanel({ order, onUpdated }) {
  const toast = useToast();
  const allowed = order.allowedStatuses ?? [];
  const nextStatus = allowed.find((status) => status !== 'Cancelled');
  const canCancel = allowed.includes('Cancelled');
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  if (allowed.length === 0) {
    const cancelled = order.orderStatus === 'Cancelled';
    const Icon = cancelled ? XCircle : CircleCheck;
    return (
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icon className={`h-5 w-5 ${cancelled ? 'text-red-600' : 'text-emerald-600'}`} aria-hidden="true" />
          {cancelled ? 'Order cancelled' : 'Order complete'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          This order is <span className="font-semibold text-slate-700">{order.orderStatus.toLowerCase()}</span>, so its status can no
          longer be changed.
        </p>
      </section>
    );
  }

  const saveStatus = async (status) => {
    setSavingStatus(status);
    try {
      const updated = await updateOrderStatus(order._id, status, note.trim() || undefined);
      toast.success(`Order ${updated.orderNumber} is now "${updated.orderStatus}"`);
      setConfirmCancelOpen(false);
      onUpdated(updated);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setConfirmCancelOpen(false);
      setSavingStatus('');
    }
  };

  const saving = Boolean(savingStatus);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="update-status-heading">
      <h2 id="update-status-heading" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Truck className="h-5 w-5 text-blue-600" aria-hidden="true" />
        Update status
      </h2>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Current</p>
          <OrderStatusBadge status={order.orderStatus} className="mt-1" />
        </div>
        {nextStatus && (
          <>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Next step</p>
              <OrderStatusBadge status={nextStatus} className="mt-1" />
            </div>
          </>
        )}
      </div>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (nextStatus) saveStatus(nextStatus);
        }}
      >
        <InputField
          as="textarea"
          rows={2}
          label="Note for the customer (optional)"
          name="note"
          maxLength={200}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={nextStatus === 'Shipped' ? 'e.g. Handed over to the courier' : 'Shown in the order history'}
          hint={`${note.length} / 200 characters`}
        />
        {nextStatus && (
          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {savingStatus === nextStatus ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            Mark as {nextStatus}
          </button>
        )}
        {canCancel && (
          <button type="button" onClick={() => setConfirmCancelOpen(true)} className="btn btn-danger-ghost w-full ring-1 ring-red-200" disabled={saving}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancel order
          </button>
        )}
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Orders move forward one step at a time and can be cancelled until they are delivered. Delivered and cancelled orders are
        final.
      </p>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancel this order?"
        message={`Order ${order.orderNumber} will be cancelled and its items returned to stock.${
          order.paymentStatus === 'Paid' ? ' The payment will be marked as refunded.' : ''
        } This cannot be undone.`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={savingStatus === 'Cancelled'}
        onConfirm={() => saveStatus('Cancelled')}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </section>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const { data: order, loading, error, reload, setData } = useFetch(() => getOrder(id), `admin-order:${id}`);

  if (loading && !order) return <PageLoader label="Loading order..." />;
  if (error && !order) return <ErrorState title="Order not available" message={error} onRetry={reload} />;

  const address = order.shippingAddress;
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const cancelled = order.orderStatus === 'Cancelled';
  const cancelEntry = cancelled ? order.statusHistory?.findLast((entry) => entry.status === 'Cancelled') : null;

  // The update response has no customer statistics - keep the ones already loaded,
  // and re-load them after a cancellation (the customer's total changes).
  const handleUpdated = (updated) => {
    setData({ ...updated, customerStats: order.customerStats });
    if (updated.orderStatus === 'Cancelled') reload();
  };

  return (
    <div className="space-y-6">
      <PageTitle title={`Order ${order.orderNumber}`} />
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All orders
      </Link>

      <AdminPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.orderNumber}</span>
            <OrderStatusBadge status={order.orderStatus} className="text-sm" />
          </span>
        }
        description={`Placed on ${formatDateTime(order.createdAt)}`}
        actions={
          <button type="button" onClick={reload} className="btn btn-secondary" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {cancelled && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/15">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">This order was cancelled</span>
            {order.cancelledAt && ` on ${formatDateTime(order.cancelledAt)}`}
            {cancelEntry?.note && ` - ${cancelEntry.note}`}. Its items were returned to stock.
          </p>
        </div>
      )}

      <section className="card p-5 sm:p-8" aria-labelledby="admin-tracking-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-tracking-heading" className="text-base font-bold text-slate-900">
            Tracking (as the customer sees it)
          </h2>
          {!cancelled && (
            <p className="text-sm text-slate-500">
              {order.orderStatus === 'Delivered' ? 'Delivered on ' : 'Estimated delivery: '}
              <span className="font-semibold text-slate-900">
                {formatShortDate(order.orderStatus === 'Delivered' ? (order.deliveredAt ?? order.updatedAt) : order.estimatedDelivery)}
              </span>
            </p>
          )}
        </div>
        <OrderTimeline order={order} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card overflow-hidden" aria-labelledby="admin-items-heading">
            <h2 id="admin-items-heading" className="border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900 sm:px-6">
              Ordered products ({pluralize(itemCount, 'item')})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-5 py-3 sm:px-6">Product</th>
                    <th className="px-3 py-3 text-right">Price</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-5 py-3 text-right sm:px-6">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.orderItems.map((item) => (
                    <tr key={item.product}>
                      <td className="px-5 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={item.image}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70"
                          />
                          <span className="line-clamp-2 font-semibold text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-slate-700 tabular-nums">{formatPrice(item.price)}</td>
                      <td className="px-3 py-3 text-right text-slate-700 tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums sm:px-6">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-xs space-y-2.5 border-t border-slate-100 px-5 py-4 text-sm sm:px-6">
              <DetailRow label="Subtotal">{formatPrice(order.itemsPrice)}</DetailRow>
              <DetailRow label="Shipping">
                {order.shippingPrice === 0 ? <span className="text-emerald-600">Free</span> : formatPrice(order.shippingPrice)}
              </DetailRow>
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-2.5">
                <dt className="text-base font-bold text-slate-900">Total</dt>
                <dd className="text-lg font-extrabold text-slate-900">{formatPrice(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          <InfoCard icon={History} title="Status history">
            <StatusHistory history={order.statusHistory} />
          </InfoCard>
        </div>

        {/* Below 1280px this column comes first (status update at the top), as a 2-column grid from 768px. */}
        <div className="order-first grid content-start gap-6 md:grid-cols-2 xl:order-none xl:grid-cols-1">
          {/* The key resets the panel (note, buttons) after every status change. */}
          <StatusUpdatePanel key={order.orderStatus} order={order} onUpdated={handleUpdated} />

          <InfoCard icon={UserRound} title="Customer">
            <p className="font-semibold text-slate-900">{order.user?.name ?? address.fullName}</p>
            {!order.user && <p className="text-xs text-slate-400">This account no longer exists</p>}
            <p className="mt-2 flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{order.user?.email ?? address.email}</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {address.phone}
            </p>
            {order.user && (
              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                <DetailRow label="Customer since">{formatDate(order.user.createdAt)}</DetailRow>
                {order.customerStats && (
                  <>
                    <DetailRow label="Orders placed">{order.customerStats.orderCount}</DetailRow>
                    <DetailRow label="Total spent">{formatPrice(order.customerStats.totalSpent)}</DetailRow>
                  </>
                )}
              </dl>
            )}
          </InfoCard>

          <InfoCard icon={CreditCard} title="Payment">
            <dl className="space-y-2.5">
              <DetailRow label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</DetailRow>
              <DetailRow label="Status">
                <PaymentStatusBadge status={order.paymentStatus} />
              </DetailRow>
              {order.paidAt && <DetailRow label="Paid on">{formatShortDate(order.paidAt)}</DetailRow>}
              <DetailRow label="Order total">{formatPrice(order.totalPrice)}</DetailRow>
            </dl>
          </InfoCard>

          <InfoCard icon={MapPin} title="Shipping address">
            <AddressBlock address={address} />
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
