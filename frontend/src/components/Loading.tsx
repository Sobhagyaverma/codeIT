export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="verdict-strip flex items-center gap-2 py-8 text-[var(--text-dim)]">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
      {label}...
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[var(--err)]/40 bg-[var(--err)]/5 p-4 text-sm text-[var(--err)]">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--text-dim)]">
      {message}
    </div>
  );
}
