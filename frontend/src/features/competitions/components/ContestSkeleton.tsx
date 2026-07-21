export default function ContestSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading competitions"
      className="space-y-4"
      role="status"
    >
      <div className="h-48 animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]"
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
