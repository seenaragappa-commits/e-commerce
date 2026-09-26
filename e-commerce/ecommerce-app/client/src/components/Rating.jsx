import { Star } from 'lucide-react';

const STAR_SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

/** Five stars with partial fill, e.g. 4.5 -> four and a half stars. */
export default function Rating({ value = 0, count, size = 'sm', className = '' }) {
  const starSize = STAR_SIZES[size];

  if (!value) {
    return <p className={`text-xs font-medium text-slate-400 ${className}`}>No reviews yet</p>;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercent = Math.max(0, Math.min(1, value - index)) * 100;
          return (
            <span key={index} className={`relative shrink-0 ${starSize}`}>
              <Star className={`absolute inset-0 ${starSize} fill-slate-200 text-slate-200`} aria-hidden="true" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                <Star className={`${starSize} max-w-none fill-amber-400 text-amber-400`} aria-hidden="true" />
              </span>
            </span>
          );
        })}
      </div>
      <span className={`font-semibold text-slate-700 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{value.toFixed(1)}</span>
      {count > 0 && (
        <span className={`text-slate-400 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          ({count.toLocaleString()}
          {size === 'lg' ? ' ratings' : ''})
        </span>
      )}
    </div>
  );
}
