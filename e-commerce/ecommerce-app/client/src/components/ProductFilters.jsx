import { useState } from 'react';
import { CATEGORIES, PRICE_RANGES } from '../utils/constants';

function FilterSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function OptionButton({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
        active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span>{children}</span>
      {count !== undefined && count !== null && (
        <span className={`text-xs ${active ? 'text-blue-600' : 'text-slate-400'}`}>{count}</span>
      )}
    </button>
  );
}

/** Min / max price inputs. Values are only applied when the user presses "Apply". */
function PriceRangeForm({ minPrice, maxPrice, onApply }) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if ((min !== '' && Number(min) < 0) || (max !== '' && Number(max) < 0)) {
      setError('Prices cannot be negative');
      return;
    }
    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      setError('Minimum price must be lower than maximum');
      return;
    }
    setError('');
    onApply(min, max);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="min-price">
          Minimum price
        </label>
        <input
          id="min-price"
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Min $"
          value={min}
          onChange={(event) => setMin(event.target.value)}
          className="input no-spinner px-3 py-2"
        />
        <span className="text-slate-400">-</span>
        <label className="sr-only" htmlFor="max-price">
          Maximum price
        </label>
        <input
          id="max-price"
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Max $"
          value={max}
          onChange={(event) => setMax(event.target.value)}
          className="input no-spinner px-3 py-2"
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" className="btn btn-secondary btn-sm mt-2 w-full">
        Apply price
      </button>
    </form>
  );
}

/**
 * Category, price and availability filters for the catalog.
 * `filters` comes from the URL; `onChange({ key: value })` updates the URL.
 */
export default function ProductFilters({ filters, categories, onChange, onReset }) {
  const categoryList = categories ?? CATEGORIES.map((name) => ({ name, count: null }));
  const totalCount = categories ? categories.reduce((sum, category) => sum + category.count, 0) : null;

  return (
    <div className="space-y-7">
      <FilterSection title="Category">
        <div className="space-y-0.5">
          <OptionButton active={!filters.category} onClick={() => onChange({ category: '' })} count={totalCount}>
            All categories
          </OptionButton>
          {categoryList.map((category) => (
            <OptionButton
              key={category.name}
              active={filters.category === category.name}
              onClick={() => onChange({ category: category.name })}
              count={category.count}
            >
              {category.name}
            </OptionButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="space-y-0.5">
          {PRICE_RANGES.map((range) => (
            <OptionButton
              key={range.label}
              active={filters.minPrice === range.min && filters.maxPrice === range.max}
              onClick={() => onChange({ minPrice: range.min, maxPrice: range.max })}
            >
              {range.label}
            </OptionButton>
          ))}
        </div>
        {/* The key resets the inputs whenever the price filter changes elsewhere. */}
        <PriceRangeForm
          key={`${filters.minPrice}-${filters.maxPrice}`}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(event) => onChange({ inStock: event.target.checked })}
            className="h-4 w-4 cursor-pointer rounded accent-blue-600"
          />
          In stock only
        </label>
      </FilterSection>

      <button type="button" onClick={onReset} className="btn btn-secondary w-full">
        Reset all filters
      </button>
    </div>
  );
}
