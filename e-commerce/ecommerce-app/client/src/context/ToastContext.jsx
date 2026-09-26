import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let nextToastId = 1;

const TOAST_STYLES = {
  success: { Icon: CircleCheck, iconClass: 'text-emerald-600', accent: 'bg-emerald-500' },
  error: { Icon: CircleAlert, iconClass: 'text-red-600', accent: 'bg-red-500' },
  info: { Icon: Info, iconClass: 'text-blue-600', accent: 'bg-blue-500' },
};

function ToastItem({ toast, onDismiss }) {
  const { Icon, iconClass, accent } = TOAST_STYLES[toast.type];

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto relative flex w-full max-w-sm animate-slide-up items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pl-5 shadow-lg shadow-slate-900/10"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} aria-hidden="true" />
      <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-m-1 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Shows small notification messages. Usage: const toast = useToast(); toast.success('Saved!') */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type, message, duration) => {
      const id = nextToastId++;
      // Keep at most 3 toasts on screen.
      setToasts((current) => [...current.slice(-2), { id, type, message }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => show('success', message, 3500),
      error: (message) => show('error', message, 5500),
      info: (message) => show('info', message, 4500),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Bottom of the screen on phones (so the navbar stays usable), top-right on larger screens */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto sm:items-end sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};
