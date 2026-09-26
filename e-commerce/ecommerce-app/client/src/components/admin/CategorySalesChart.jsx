import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { formatPrice, pluralize } from '../../utils/format';

/**
 * Revenue per product category as thin horizontal bars: one series, one colour,
 * each bar labelled at its tip. Hover or focus a row for units sold and share;
 * "Table view" shows the same numbers as a table.
 */
export default function CategorySalesChart({ categories }) {
  const [showTable, setShowTable] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const total = categories.reduce((sum, item) => sum + item.revenue, 0);
  const max = Math.max(0, ...categories.map((item) => item.revenue)) || 1;
  const shareOf = (item) => (total ? Math.round((item.revenue / total) * 100) : 0);

  return (
    <figure className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <h2 className="text-base font-bold text-slate-900">Sales by category</h2>
          <p className="mt-0.5 text-sm text-slate-500">All time, cancelled orders excluded</p>
        </figcaption>
        {categories.length > 0 && (
          <button type="button" onClick={() => setShowTable((value) => !value)} className="btn btn-secondary btn-sm">
            {showTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
            {showTable ? 'Chart view' : 'Table view'}
          </button>
        )}
      </div>

      {categories.length === 0 && <p className="py-12 text-center text-sm text-slate-400">No sales yet</p>}

      {categories.length > 0 && showTable && (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-2 font-bold">Category</th>
              <th className="py-2 text-right font-bold">Units</th>
              <th className="py-2 text-right font-bold">Revenue</th>
              <th className="py-2 text-right font-bold">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((item) => (
              <tr key={item.category}>
                <td className="py-2 text-slate-700">{item.category}</td>
                <td className="py-2 text-right text-slate-700 tabular-nums">{item.units}</td>
                <td className="py-2 text-right font-semibold text-slate-900 tabular-nums">{formatPrice(item.revenue)}</td>
                <td className="py-2 text-right text-slate-500 tabular-nums">{shareOf(item)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {categories.length > 0 && !showTable && (
        <ul className="mt-5 space-y-2" aria-label="Revenue by category">
          {categories.map((item) => {
            const active = activeCategory === item.category;
            return (
              <li
                key={item.category}
                tabIndex={0}
                aria-label={`${item.category}: ${formatPrice(item.revenue)} from ${pluralize(item.units, 'unit')}, ${shareOf(item)}% of sales`}
                onMouseEnter={() => setActiveCategory(item.category)}
                onMouseLeave={() => setActiveCategory(null)}
                onFocus={() => setActiveCategory(item.category)}
                onBlur={() => setActiveCategory(null)}
                className={`relative grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-lg px-1 py-1.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300 ${
                  active ? 'bg-slate-50' : ''
                }`}
              >
                <span className="truncate text-slate-600">{item.category}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-3 rounded-r-[4px] transition-colors ${active ? 'bg-blue-500' : 'bg-blue-600'}`}
                    style={{ width: `calc((100% - 5.5rem) * ${item.revenue / max})` }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold whitespace-nowrap text-slate-900 tabular-nums">{formatPrice(item.revenue)}</span>
                </span>

                {active && (
                  <span
                    role="status"
                    className="pointer-events-none absolute right-1 bottom-full z-10 mb-1 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-lg"
                  >
                    <span className="block text-sm font-bold whitespace-nowrap">{formatPrice(item.revenue)}</span>
                    <span className="block text-xs whitespace-nowrap text-slate-300">
                      {item.category} - {pluralize(item.units, 'unit')} sold - {shareOf(item)}% of sales
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
