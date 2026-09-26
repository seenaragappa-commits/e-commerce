import { formatDateTime } from '../utils/format';

/** Every status change of an order (with the store's notes), newest first. */
export default function StatusHistory({ history = [] }) {
  const entries = [...history].reverse();

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => {
        let dotColor = 'bg-slate-300';
        if (entry.status === 'Cancelled') dotColor = 'bg-red-500';
        else if (index === 0) dotColor = 'bg-blue-600';

        return (
          <li key={`${entry.status}-${entry.date}`} className="flex gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900">{entry.status}</p>
              {entry.note && <p className="text-slate-600">{entry.note}</p>}
              <p className="text-xs text-slate-400">{formatDateTime(entry.date)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
