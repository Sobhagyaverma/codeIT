export default function PracticeSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading practice problems"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: Math.max(1, count) }, (_, index) => (
        <div
          className="animate-pulse rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4"
          key={index}
        >
          <div className="h-3 w-20 rounded bg-[var(--bg-inset)]" />
          <div className="mt-4 h-5 w-4/5 rounded bg-[var(--bg-inset)]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-[var(--bg-inset)]" />
          <div className="mt-6 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-[var(--bg-inset)]" />
            <div className="h-6 w-20 rounded-full bg-[var(--bg-inset)]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
