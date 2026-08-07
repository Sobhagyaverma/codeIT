import { Link } from "react-router-dom";

const TILES = [
  { icon: "lock", label: "Private Lobbies", alert: false },
  { icon: "shuffle", label: "Random Problems", alert: false },
  { icon: "group_add", label: "Up to 10 Players", alert: false },
  { icon: "block", label: "AI Disabled", alert: true },
] as const;

export default function QuickClashSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="flex flex-col items-center gap-12 md:flex-row">
        <div className="md:w-1/2">
          <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
            Adrenaline-Pumping Quick Clash
          </h2>
          <p className="font-body-md mb-6 leading-relaxed text-white/60">
            Test your skills under pressure. Create private rooms, invite
            friends, and battle it out on random problems without affecting your
            global rating.
          </p>
          <div className="mb-6 grid grid-cols-2 gap-4">
            {TILES.map((tile) => (
              <div
                key={tile.label}
                className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 text-center"
              >
                {tile.alert && (
                  <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
                )}
                <span
                  className={`material-symbols-outlined relative z-10 mb-2 ${
                    tile.alert ? "text-red-400" : "text-[#a855f7]"
                  }`}
                >
                  {tile.icon}
                </span>
                <span className="relative z-10 text-[13px] font-medium text-white">
                  {tile.label}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/competitions/quick"
            className="font-body-sm inline-flex rounded-full border border-[#a855f7] bg-transparent px-6 py-2 text-[14px] font-semibold text-[#a855f7] transition-all hover:bg-[#a855f7]/10"
          >
            Learn More About Clash
          </Link>
        </div>

        <div className="md:w-1/2">
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="flex items-center gap-2 font-medium text-white">
                <span className="material-symbols-outlined text-[#a855f7]">
                  settings
                </span>{" "}
                Clash Settings
              </h3>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/50">
                Host View
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-[12px] text-white/50">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  <div className="cursor-pointer rounded border border-green-500/50 bg-green-500/20 px-3 py-1.5 text-[12px] text-green-400">
                    Easy
                  </div>
                  <div className="cursor-pointer rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/70">
                    Medium
                  </div>
                  <div className="cursor-pointer rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/70">
                    Hard
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-white/50">
                  Duration
                </label>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/3 bg-[#a855f7]" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/40">
                  <span>15m</span>
                  <span className="text-white">30m</span>
                  <span>60m</span>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <Link
                  to="/competitions/quick"
                  className="block w-full rounded bg-[#a855f7] py-2 text-center text-[14px] font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-colors hover:bg-opacity-90"
                >
                  Start Match
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
