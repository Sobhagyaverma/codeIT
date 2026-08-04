import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastAction = {
  label: string;
  /** Resolve to false to keep the toast open (e.g. the action failed). */
  onClick: () => void | boolean | Promise<void | boolean>;
  variant?: "primary" | "neutral" | "danger";
  icon?: string;
};

export type ToastOptions = {
  title: string;
  message?: string;
  /** Material Symbols name shown in the icon tile. Ignored when `avatarName` is set. */
  icon?: string;
  /** Renders an avatar instead of an icon tile (initial fallback when no URL). */
  avatarName?: string;
  avatarUrl?: string | null;
  tone?: "default" | "success" | "error";
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number;
  actions?: ToastAction[];
  /** Lets callers replace/dismiss a specific toast later (e.g. request resolved elsewhere). */
  key?: string;
};

type Toast = ToastOptions & {
  id: number;
  createdAt: number;
  exiting: boolean;
};

type ToastState = {
  showToast: (options: ToastOptions) => number;
  updateToast: (id: number, patch: Partial<ToastOptions>) => void;
  dismissToast: (id: number) => void;
  dismissToastByKey: (key: string) => void;
};

const ToastContext = createContext<ToastState | undefined>(undefined);

const DEFAULT_DURATION = 6000;
const EXIT_MS = 260;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());
  const hovered = useRef(new Set<number>());
  // Mirrors `toasts` so key-based lookups don't need an impure state updater.
  const toastsRef = useRef<Toast[]>([]);
  toastsRef.current = toasts;

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    hovered.current.delete(id);
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      window.setTimeout(() => remove(id), EXIT_MS);
    },
    [remove]
  );

  const scheduleDismiss = useCallback(
    (id: number, duration: number) => {
      const existing = timers.current.get(id);
      if (existing) window.clearTimeout(existing);
      if (duration <= 0) return;
      const timer = window.setTimeout(() => {
        // Keep the toast alive while the pointer rests on it.
        if (hovered.current.has(id)) {
          scheduleDismiss(id, 1500);
          return;
        }
        dismissToast(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const toast: Toast = {
        ...options,
        id,
        createdAt: Date.now(),
        exiting: false,
      };
      setToasts((list) => {
        const withoutDuplicateKey = options.key
          ? list.filter((t) => t.key !== options.key)
          : list;
        // Cap the stack so a burst of events can't cover the screen.
        return [...withoutDuplicateKey, toast].slice(-4);
      });
      scheduleDismiss(id, options.duration ?? DEFAULT_DURATION);
      return id;
    },
    [scheduleDismiss]
  );

  const updateToast = useCallback(
    (id: number, patch: Partial<ToastOptions>) => {
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      if (patch.duration !== undefined) scheduleDismiss(id, patch.duration);
    },
    [scheduleDismiss]
  );

  const dismissToastByKey = useCallback(
    (key: string) => {
      toastsRef.current
        .filter((t) => t.key === key && !t.exiting)
        .forEach((t) => dismissToast(t.id));
    },
    [dismissToast]
  );

  const setHovered = useCallback((id: number, isHovered: boolean) => {
    if (isHovered) hovered.current.add(id);
    else hovered.current.delete(id);
  }, []);

  const value = useMemo(
    () => ({ showToast, updateToast, dismissToast, dismissToastByKey }),
    [showToast, updateToast, dismissToast, dismissToastByKey]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport
        toasts={toasts}
        onDismiss={dismissToast}
        onHoverChange={setHovered}
      />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
  onHoverChange,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  onHoverChange: (id: number, hovered: boolean) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(24rem,calc(100vw-3rem))] flex-col gap-3"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onHoverChange={onHoverChange}
        />
      ))}
    </div>
  );
}

const TONE_RING: Record<string, string> = {
  default: "border-primary/30",
  success: "border-primary/50",
  error: "border-error/40",
};

const TONE_ICON: Record<string, string> = {
  default: "bg-primary/15 text-primary",
  success: "bg-primary/20 text-primary",
  error: "bg-error/15 text-error",
};

const ACTION_CLASS: Record<string, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container shadow-[0_0_12px_rgba(221,183,255,0.3)]",
  neutral:
    "border border-outline-variant/30 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
  danger:
    "border border-error/30 bg-error/10 text-error hover:bg-error/20",
};

function ToastCard({
  toast,
  onDismiss,
  onHoverChange,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
  onHoverChange: (id: number, hovered: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const tone = toast.tone ?? "default";

  const runAction = async (action: ToastAction) => {
    if (busy) return;
    setBusy(true);
    try {
      const keepOpen = await action.onClick();
      if (keepOpen !== false) onDismiss(toast.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`toast-card pointer-events-auto ${
        toast.exiting ? "toast-exit" : "toast-pop"
      }`}
      onMouseEnter={() => onHoverChange(toast.id, true)}
      onMouseLeave={() => onHoverChange(toast.id, false)}
    >
      <div
        role="status"
        className={`glass-panel flex items-start gap-3 rounded-xl border p-4 shadow-2xl ${TONE_RING[tone]}`}
      >
        {toast.avatarName ? (
          toast.avatarUrl ? (
            <img
              src={toast.avatarUrl}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded-full border border-outline-variant/40 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-gradient-to-br from-primary/30 to-secondary-container/40 font-label-md text-base font-bold text-primary">
              {toast.avatarName.slice(0, 1).toUpperCase()}
            </span>
          )
        ) : (
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${TONE_ICON[tone]}`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.icon ?? "notifications"}
            </span>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-label-md text-label-md font-bold text-on-surface">
              {toast.title}
            </h5>
            <span className="whitespace-nowrap font-code-sm text-[11px] text-on-surface-variant/60">
              just now
            </span>
          </div>
          {toast.message && (
            <p className="mt-0.5 font-body-md text-[13px] leading-snug text-on-surface-variant">
              {toast.message}
            </p>
          )}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {toast.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={busy}
                  onClick={() => void runAction(action)}
                  className={`picker flex items-center gap-1.5 rounded-md px-3 py-1.5 font-label-md text-[13px] disabled:opacity-60 ${
                    ACTION_CLASS[action.variant ?? "neutral"]
                  }`}
                >
                  {action.icon && (
                    <span className="material-symbols-outlined text-[16px]">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
          className="-mr-1 -mt-1 text-on-surface-variant/60 transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
