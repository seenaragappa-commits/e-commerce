import { LOW_STOCK_THRESHOLD } from '../utils/constants';

/** "Out of Stock" (0), "Only N left" (1-5) or "In stock". */
export default function StockBadge({ stock, className = '' }) {
  if (stock <= 0) {
    return <span className={`badge bg-red-50 text-red-700 ring-1 ring-red-600/15 ${className}`}>Out of Stock</span>;
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return <span className={`badge bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 ${className}`}>Only {stock} left</span>;
  }
  return <span className={`badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 ${className}`}>In stock</span>;
}
