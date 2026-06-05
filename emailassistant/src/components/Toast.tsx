import type { ToastMessage } from '../hooks/useToast';

const toastStyles: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-zinc-800 text-white',
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-0 right-0 px-4 z-50 flex flex-col gap-2 items-center pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={[
            'pointer-events-auto w-full max-w-sm rounded-xl py-3 px-4 shadow-lg text-sm font-medium text-left',
            'flex items-center gap-2 transition-all duration-300',
            toastStyles[toast.type],
          ].join(' ')}
          aria-label={`${toast.type}: ${toast.message} (tap to dismiss)`}
        >
          {toast.type === 'success' && <span aria-hidden="true">✅</span>}
          {toast.type === 'error' && <span aria-hidden="true">❌</span>}
          {toast.type === 'info' && <span aria-hidden="true">ℹ️</span>}
          {toast.message}
        </button>
      ))}
    </div>
  );
}
