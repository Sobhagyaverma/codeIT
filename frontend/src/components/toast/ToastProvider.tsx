import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = `toast-${Date.now()}-${toastSeq++}`;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const toneColor =
          toast.tone === "success"
            ? "var(--ok)"
            : toast.tone === "error"
              ? "var(--err)"
              : "var(--info)";

        return (
          <div
            key={toast.id}
            role="status"
            className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-[var(--bg-raised)] px-4 py-3 shadow-lg"
            style={{
              borderColor: `color-mix(in srgb, ${toneColor} 45%, var(--line))`,
            }}
          >
            <div
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: toneColor }}
              aria-hidden
            />
            <p className="flex-1 text-sm text-[var(--text)]">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}
