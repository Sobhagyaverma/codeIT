const ROWS = [
  { feature: "Problem Repository", others: true, codeit: true },
  { feature: "Structured Learning", others: false, codeit: true },
  { feature: "Contextual AI Coach", others: false, codeit: true },
  { feature: "Quick Clash Battles", others: false, codeit: true },
  { feature: "Realtime Collaborative IDE", others: false, codeit: true },
] as const;

function Cell({ ok }: { ok: boolean }) {
  return (
    <div className="col-span-1 flex items-center justify-center">
      <span
        className={`material-symbols-outlined ${
          ok ? "text-green-500" : "text-red-500/50"
        }`}
      >
        {ok ? "check" : "close"}
      </span>
    </div>
  );
}

export default function ComparisonSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1000px] px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
          Why Choose CodeIT?
        </h2>
        <p className="text-[15px] text-white/50">
          Built for modern developers who want to learn faster and together.
        </p>
      </div>
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 p-4">
          <div className="col-span-1 text-[14px] font-medium text-white/50">
            Features
          </div>
          <div className="col-span-1 text-center text-[14px] font-medium text-white/50">
            Other Platforms
          </div>
          <div className="col-span-1 flex items-center justify-center gap-2 text-center text-[16px] font-bold text-[#a855f7]">
            <span className="material-symbols-outlined text-[18px]">star</span>{" "}
            CodeIT
          </div>
        </div>
        <div className="flex flex-col divide-y divide-white/5">
          {ROWS.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-3 p-4 transition-colors hover:bg-white/5"
            >
              <div className="col-span-1 flex items-center text-[14px] text-white/80">
                {row.feature}
              </div>
              <Cell ok={row.others} />
              <Cell ok={row.codeit} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
