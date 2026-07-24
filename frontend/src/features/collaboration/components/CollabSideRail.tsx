import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "codeit.collab.railWidth";
const COLLAPSED_KEY = "codeit.collab.railCollapsed";
const MIN_W = 240;
const MAX_W = 400;
const DEFAULT_W = 300;
const COLLAPSED_W = 48;

type Props = {
  children: ReactNode;
  collapsedContent?: ReactNode;
  onInvite?: () => void;
};

export default function CollabSideRail({
  children,
  collapsedContent,
  onInvite,
}: Props) {
  const [width, setWidth] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const n = raw ? Number(raw) : DEFAULT_W;
      return Number.isFinite(n) ? Math.min(MAX_W, Math.max(MIN_W, n)) : DEFAULT_W;
    } catch {
      return DEFAULT_W;
    }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const dragging = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  useEffect(() => {
    try {
      sessionStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging.current) return;
    const fromRight = window.innerWidth - clientX;
    setWidth(Math.min(MAX_W, Math.max(MIN_W, fromRight)));
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const stop = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [onMove]);

  if (collapsed) {
    return (
      <aside
        className="hidden w-12 shrink-0 flex-col items-center border-l border-[var(--line)] bg-[var(--bg-raised)]/40 py-2 transition-[width] duration-200 lg:flex"
        style={{ width: COLLAPSED_W }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="rounded-md p-2 text-[var(--text-dim)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
          title="Expand panel"
          aria-label="Expand participants and chat"
        >
          «
        </button>
        {onInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="mt-2 rounded-md p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10"
            title="Invite"
            aria-label="Invite"
          >
            +
          </button>
        )}
        <div className="mt-3 flex flex-col items-center gap-2">
          {collapsedContent}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="relative hidden min-h-0 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--bg-raised)]/30 transition-[width] duration-200 lg:flex"
      style={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize side panel"
        onMouseDown={(e) => {
          e.preventDefault();
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="absolute left-0 top-0 z-10 h-full w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-[var(--accent)]/40"
      />
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          Collaboration
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-md px-2 py-1 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
          title="Collapse panel"
        >
          »
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </aside>
  );
}
