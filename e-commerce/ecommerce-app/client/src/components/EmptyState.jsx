export default function EmptyState({ icon: Icon, title, message, action, className = '' }) {
  return (
    <div
      className={`flex animate-fade-in flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
