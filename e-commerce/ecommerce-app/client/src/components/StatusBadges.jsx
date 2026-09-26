const ORDER_STATUS_STYLES = {
  'Order Placed': 'bg-slate-100 text-slate-700 ring-slate-500/20',
  Confirmed: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Processing: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Shipped: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  'Out for Delivery': 'bg-amber-50 text-amber-700 ring-amber-600/25',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
};

const PAYMENT_STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/25',
  Refunded: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function OrderStatusBadge({ status, className = '' }) {
  return (
    <span className={`badge ring-1 ${ORDER_STATUS_STYLES[status] ?? ORDER_STATUS_STYLES['Order Placed']} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = '' }) {
  return (
    <span className={`badge ring-1 ${PAYMENT_STATUS_STYLES[status] ?? PAYMENT_STATUS_STYLES.Pending} ${className}`}>
      {status}
    </span>
  );
}
