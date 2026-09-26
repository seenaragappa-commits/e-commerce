import { Link, useParams } from 'react-router';
import { ArrowRight, CalendarDays, Check, Copy, CreditCard, MapPin, PackageSearch, Receipt } from 'lucide-react';
import AddressBlock from '../components/AddressBlock';
import ErrorState from '../components/ErrorState';
import PageTitle from '../components/PageTitle';
import PriceSummary from '../components/PriceSummary';
import ProductImage from '../components/ProductImage';
import { PageLoader } from '../components/Spinner';
import { PaymentStatusBadge } from '../components/StatusBadges';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import { getOrder } from '../services/orderService';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { formatDateTime, formatPrice, formatShortDate } from '../utils/format';

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold text-slate-900">{children}</div>
    </div>
  );
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(() => getOrder(id), `order:${id}`);

  if (loading) return <PageLoader label="Loading your order..." />;
  if (error || !order) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error || 'Order not found'} onRetry={reload} />
      </div>
    );
  }

  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const { shippingAddress: address } = order;

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied');
    } catch {
      toast.error('Could not copy - please copy it manually');
    }
  };

  return (
    <>
      <PageTitle title="Order confirmed" />
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50 to-transparent" />
        <div className="container-page relative max-w-3xl py-12 sm:py-16">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-100">
              <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Thank you for your order!</h1>
            <p className="mx-auto mt-3 max-w-lg text-slate-600">
              Your order has been placed successfully. We&apos;ll start preparing it right away - you can follow every step on the
              tracking page.
            </p>

            <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-white py-2.5 pr-2 pl-5 text-left shadow-sm">
              <span>
                <span className="block text-xs text-slate-500">Order number</span>
                <span className="block font-mono text-base font-bold tracking-wide whitespace-nowrap text-slate-900">{order.orderNumber}</span>
              </span>
              <button type="button" onClick={copyOrderNumber} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Copy order number">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="card mt-10 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile icon={Receipt} label="Placed on">
                {formatDateTime(order.createdAt)}
              </InfoTile>
              <InfoTile icon={CreditCard} label="Payment">
                <span className="flex flex-wrap items-center gap-2">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  <PaymentStatusBadge status={order.paymentStatus} />
                </span>
              </InfoTile>
              <InfoTile icon={CalendarDays} label="Estimated delivery">
                {order.estimatedDelivery ? formatShortDate(order.estimatedDelivery) : 'To be confirmed'}
              </InfoTile>
            </div>

            <h2 className="mt-8 text-base font-bold text-slate-900">Items in this order</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {order.orderItems.map((item) => (
                <li key={item.product} className="flex items-center gap-4 py-3">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      Qty {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Shipping to
                </h3>
                <div className="mt-2">
                  <AddressBlock address={address} showPhone />
                </div>
              </div>
              <PriceSummary itemCount={itemCount} subtotal={order.itemsPrice} shipping={order.shippingPrice} total={order.totalPrice} />
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/orders/${order._id}`} className="btn btn-primary btn-lg">
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
              Track your order
            </Link>
            <Link to="/products" className="btn btn-secondary btn-lg">
              Continue shopping
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
