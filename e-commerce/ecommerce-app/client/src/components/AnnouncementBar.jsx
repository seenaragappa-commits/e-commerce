import { ShieldCheck, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';
import { formatPrice } from '../utils/format';

export default function AnnouncementBar() {
  return (
    <div className="bg-slate-900 text-slate-200">
      <div className="container-page flex h-9 items-center justify-center gap-6 text-xs font-medium">
        <p className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-blue-300" aria-hidden="true" />
          Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD).replace('.00', '')}
        </p>
        <p className="hidden items-center gap-2 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          Secure checkout &amp; real-time order tracking
        </p>
      </div>
    </div>
  );
}
