import { LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <Spinner className="h-8 w-8 text-blue-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
