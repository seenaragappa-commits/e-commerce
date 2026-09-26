import { Minus, Plus } from 'lucide-react';

/** A "-  2  +" control. The value can never go below `min` or above `max` (the stock). */
export default function QuantitySelector({ value, min = 1, max, onChange, size = 'md', disabled = false, label = 'Quantity' }) {
  const buttonSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const buttonClass = `${buttonSize} flex items-center justify-center text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent`;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" role="group" aria-label={label}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={`min-w-10 px-1 text-center font-semibold text-slate-900 tabular-nums ${size === 'sm' ? 'text-sm' : 'text-base'}`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
