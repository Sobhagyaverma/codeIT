import { useState } from "react";
import { BOARD_TEMPLATES } from "./templates";

type Props = {
  onApply: (templateId: string) => void;
  disabled?: boolean;
};

export default function TemplatesBar({ onApply, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-40"
      >
        Templates {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] py-1 shadow-xl">
          {BOARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                onApply(t.id);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left hover:bg-[var(--bg-inset)] disabled:opacity-40"
            >
              <span className="block text-xs font-semibold text-[var(--text)]">
                {t.label}
              </span>
              <span className="block text-[10px] text-[var(--text-dim)]">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
