import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { formatCompactPrice, formatPrice, pluralize } from '../../utils/format';

// The API sends plain UTC dates ("2026-09-25"), so format them in UTC too.
const dayLabel = (isoDate, options) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(new Date(`${isoDate}T00:00:00Z`));

/** Rounds the axis maximum up to a clean number with at most 5 intervals (e.g. 449 -> 500). */
const getAxis = (maxValue) => {
  if (maxValue <= 0) return { max: 100, step: 25 };
  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const step = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]
    .map((factor) => factor * magnitude)
    .find((candidate) => Math.ceil(maxValue / candidate) <= 5);
  return { max: Math.ceil(maxValue / step) * step, step };
};

const PLOT_HEIGHT = 208; // px - the x-axis labels sit below this, inside the card

/**
 * Revenue per day for the last 7 days: one series, one colour, thin columns.
 * Hover or focus a column for its value; "Table view" shows the same numbers as a table.
 */
export default function SalesChart({ days }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const maxRevenue = Math.max(0, ...days.map((day) => day.revenue));
  const axis = getAxis(maxRevenue);
  const ticks = Array.from({ length: Math.round(axis.max / axis.step) + 1 }, (_, index) => index * axis.step);
  const weekTotal = days.reduce((sum, day) => sum + day.revenue, 0);
  const weekOrders = days.reduce((sum, day) => sum + day.orders, 0);
  const peakIndex = maxRevenue > 0 ? days.findIndex((day) => day.revenue === maxRevenue) : -1;
  const active = activeIndex === null ? null : days[activeIndex];

  return (
    <figure className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <h2 className="text-base font-bold text-slate-900">Revenue - last 7 days</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatPrice(weekTotal)} from {pluralize(weekOrders, 'order')} (cancelled orders excluded)
          </p>
        </figcaption>
        <button type="button" onClick={() => setShowTable((value) => !value)} className="btn btn-secondary btn-sm">
          {showTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
          {showTable ? 'Chart view' : 'Table view'}
        </button>
      </div>

      {showTable ? (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-2 font-bold">Date</th>
              <th className="py-2 text-right font-bold">Orders</th>
              <th className="py-2 text-right font-bold">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.map((day) => (
              <tr key={day.date}>
                <td className="py-2 text-slate-700">{dayLabel(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                <td className="py-2 text-right text-slate-700 tabular-nums">{day.orders}</td>
                <td className="py-2 text-right font-semibold text-slate-900 tabular-nums">{formatPrice(day.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6 flex gap-3">
          {/* Y axis */}
          <div className="relative w-10 shrink-0 text-right text-[11px] text-slate-400 tabular-nums" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="absolute right-0 leading-none" style={{ bottom: `${(tick / axis.max) * 100}%`, transform: 'translateY(50%)' }}>
                {formatCompactPrice(tick)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            {/* Plot area */}
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {/* Hairline gridlines */}
              {ticks.map((tick) => (
                <span
                  key={tick}
                  aria-hidden="true"
                  className={`absolute inset-x-0 h-px ${tick === 0 ? 'bg-slate-300' : 'bg-slate-100'}`}
                  style={{ bottom: `${(tick / axis.max) * 100}%` }}
                />
              ))}

              {maxRevenue === 0 && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">No sales in the last 7 days</p>
              )}

              <div className="absolute inset-0 flex" role="list" aria-label="Daily revenue">
                {days.map((day, index) => {
                  const heightPercent = (day.revenue / axis.max) * 100;
                  const label = `${dayLabel(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${formatPrice(day.revenue)} from ${pluralize(day.orders, 'order')}`;
                  return (
                    <div
                      key={day.date}
                      role="listitem"
                      tabIndex={0}
                      aria-label={label}
                      className="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(null)}
                    >
                      {/* Peak value, labelled directly */}
                      {index === peakIndex && activeIndex === null && (
                        <span
                          className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-slate-700"
                          style={{ bottom: `calc(${heightPercent}% + 6px)` }}
                        >
                          {formatCompactPrice(day.revenue)}
                        </span>
                      )}
                      <span
                        className={`w-[55%] max-w-6 rounded-t-[4px] transition-colors ${
                          activeIndex === index ? 'bg-blue-500' : 'bg-blue-600'
                        } group-focus-visible:ring-2 group-focus-visible:ring-blue-300 group-focus-visible:ring-offset-2`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Tooltip for the hovered / focused column */}
              {active && (
                <div
                  className="pointer-events-none absolute z-10 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-lg"
                  style={{
                    left: `${((activeIndex + 0.5) / days.length) * 100}%`,
                    bottom: `calc(${(active.revenue / axis.max) * 100}% + 10px)`,
                    transform: `translateX(${activeIndex === 0 ? '-25%' : activeIndex === days.length - 1 ? '-75%' : '-50%'})`,
                  }}
                  role="status"
                >
                  <p className="text-sm font-bold whitespace-nowrap">{formatPrice(active.revenue)}</p>
                  <p className="text-xs whitespace-nowrap text-slate-300">
                    {dayLabel(active.date, { weekday: 'short', month: 'short', day: 'numeric' })} - {pluralize(active.orders, 'order')}
                  </p>
                </div>
              )}
            </div>

            {/* X axis labels */}
            <div className="mt-2 flex" aria-hidden="true">
              {days.map((day, index) => (
                <span
                  key={day.date}
                  className={`flex-1 text-center text-[11px] ${index === days.length - 1 ? 'font-bold text-slate-700' : 'text-slate-500'}`}
                >
                  {index === days.length - 1 ? 'Today' : dayLabel(day.date, { weekday: 'short' })}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
