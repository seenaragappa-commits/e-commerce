/**
 * Number of orders in each status as thin horizontal bars.
 * One colour for every bar (the length carries the value); counts are labelled at the bar tips.
 */
export default function StatusBreakdown({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="status-breakdown-heading">
      <h2 id="status-breakdown-heading" className="text-base font-bold text-slate-900">
        Orders by status
      </h2>
      <p className="mt-0.5 text-sm text-slate-500">{total} orders in total</p>

      <ul className="mt-5 space-y-3.5">
        {items.map(({ status, count }) => {
          const share = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm">
              <span className="truncate text-slate-600">{status}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 rounded-r-[4px] bg-blue-600"
                  style={{ width: count ? `calc((100% - 4.5rem) * ${count / max})` : 0 }}
                  aria-hidden="true"
                />
                <span className="font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                  {count}
                  <span className="ml-1 font-normal text-slate-400">({share}%)</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
