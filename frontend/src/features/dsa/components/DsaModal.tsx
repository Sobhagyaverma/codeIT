import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function DsaModal({ open, title, onClose, children, wide }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("input,button,textarea")?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <h2 id={titleId} className="font-headline-lg text-lg font-bold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
