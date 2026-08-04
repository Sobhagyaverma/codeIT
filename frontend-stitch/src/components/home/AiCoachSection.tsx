const POINTS = [
  {
    icon: "analytics",
    title: "Deep Analysis",
    description: "Understands your specific bug, not just generic errors.",
  },
  {
    icon: "format_list_numbered",
    title: "Progressive Hints",
    description:
      "Controls how much help you get, from vague concepts to pseudo-code.",
  },
  {
    icon: "school",
    title: "Never Spoons-feeds",
    description: "Forces you to think and apply the learned concepts.",
  },
] as const;

export default function AiCoachSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="flex flex-col items-center gap-12 md:flex-row">
        <div className="order-2 md:order-1 md:w-1/2">
          <div className="glass-card relative overflow-hidden rounded-xl p-6">
            <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[100px] text-[#a855f7]">
                psychology
              </span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[12px] text-red-400">
                  <span className="material-symbols-outlined text-[14px]">
                    cancel
                  </span>{" "}
                  Wrong Answer on Test Case 4
                </div>
                <div className="font-code-sm rounded bg-black/50 p-2 text-[12px] text-white/70">
                  Expected: [1, 2], Output: [2, 1]
                </div>
              </div>
              <div className="flex justify-center gap-2 py-2">
                <span className="material-symbols-outlined animate-bounce text-[#a855f7]">
                  arrow_downward
                </span>
              </div>
              <div className="rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#a855f7]">
                    smart_toy
                  </span>
                  <span className="text-[13px] font-medium text-white">
                    AI Coach Analysis
                  </span>
                </div>
                <p className="mb-4 text-[13px] leading-relaxed text-white/70">
                  You&apos;re close! Your logic finds the correct indices, but the
                  order is swapped. Remember, the problem asks for the indices
                  in the order they appear.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-between rounded bg-white/5 p-2 text-[12px] text-white/80 transition-colors hover:bg-white/10"
                  >
                    <span>Get a conceptual hint</span>
                    <span className="material-symbols-outlined text-[14px]">
                      lightbulb
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-between rounded bg-white/5 p-2 text-[12px] text-white/80 transition-colors hover:bg-white/10"
                  >
                    <span>Check complexity</span>
                    <span className="material-symbols-outlined text-[14px]">
                      speed
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2 md:w-1/2">
          <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
            Smarter Learning with AI Coach
          </h2>
          <p className="font-body-md mb-6 leading-relaxed text-white/60">
            Our AI doesn&apos;t just give you the answer. It guides you to the
            solution, helping you understand the underlying concepts.
          </p>
          <ul className="flex flex-col gap-4">
            {POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-1 text-[#a855f7]">
                  {point.icon}
                </span>
                <div>
                  <h4 className="text-[15px] font-medium text-white">
                    {point.title}
                  </h4>
                  <p className="text-[13px] text-white/50">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
