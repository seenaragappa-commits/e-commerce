import { CircleAlert, RefreshCw } from 'lucide-react';

/** Shown when an API request fails, with an optional "Try again" button. */
export default function ErrorState({ title = 'Something went wrong', message, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex animate-fade-in flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 px-6 py-14 text-center ${className}`}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <CircleAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-slate-600">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary mt-6">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
