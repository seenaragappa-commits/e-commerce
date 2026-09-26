import { formatPrice, pluralize } from '../utils/format';

/** Subtotal / Shipping / Total rows used by the cart, checkout and order pages. */
export default function PriceSummary({ itemCount, subtotal, shipping, total, estimated = false }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-slate-600">Subtotal ({pluralize(itemCount, 'item')})</dt>
        <dd className="font-semibold text-slate-900">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-slate-600">Shipping</dt>
        <dd className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
          {shipping === 0 ? 'Free' : formatPrice(shipping)}
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
        <dt className="text-base font-bold text-slate-900">{estimated ? 'Estimated total' : 'Total'}</dt>
        <dd className="text-xl font-extrabold text-slate-900">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
