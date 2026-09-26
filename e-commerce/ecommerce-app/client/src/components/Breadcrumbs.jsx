import { Link } from 'react-router';
import { ChevronRight, House } from 'lucide-react';

/** items: [{ label: 'Products', to: '/products' }, { label: 'Current page' }] */
export default function Breadcrumbs({ items, className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <li>
          <Link to="/" className="flex items-center gap-1 transition hover:text-blue-600">
            <House className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
            {item.to ? (
              <Link to={item.to} className="transition hover:text-blue-600">
                {item.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-slate-800" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
