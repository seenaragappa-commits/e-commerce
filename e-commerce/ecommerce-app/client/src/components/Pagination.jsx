import { ChevronLeft, ChevronRight } from 'lucide-react';

// e.g. page 5 of 10 -> [1, '...', 4, 5, 6, '...', 10]
const getPageNumbers = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const numbers = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) numbers.push('...');
  for (let n = start; n <= end; n += 1) numbers.push(n);
  if (end < pages - 1) numbers.push('...');
  numbers.push(pages);
  return numbers;
};

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const baseClass = 'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        className={`${baseClass} text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none`}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers(page, pages).map((number, index) =>
        number === '...' ? (
          <span key={`gap-${index}`} className="px-1 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-current={number === page ? 'page' : undefined}
            className={`${baseClass} ${
              number === page
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
            }`}
          >
            {number}
          </button>
        ),
      )}

      <button
        type="button"
        className={`${baseClass} text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none`}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
