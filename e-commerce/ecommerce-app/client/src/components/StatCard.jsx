import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

/**
 * A KPI tile: icon, label, value and an optional detail line.
 * With `to` the whole tile is a link (e.g. to the filtered order list).
 */
export default function StatCard({ icon: Icon, label, value, detail, color = 'bg-blue-50 text-blue-600', to, className = '' }) {
  const content = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
      </div>
      {to && (
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-blue-600"
          aria-hidden="true"
        />
      )}
    </>
  );

  const classes = `card flex items-start gap-4 p-5 ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        className={`group ${classes} transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
      >
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}
