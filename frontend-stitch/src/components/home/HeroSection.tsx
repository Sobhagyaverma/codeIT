import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRegistration } from "../../context/RegistrationContext";

const BADGES = [
  "AI Coach",
  "Quick Clash",
  "Live Contests",
  "CodeRoom & Friends",
] as const;

/** Stitch hero — mockup, CTAs, badges; preserves float + parallax. */
export default function HeroSection() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { config } = useRegistration();
  const privateBeta = config.privateBeta;

  useEffect(() => {
    const mockup = mockupRef.current;
    if (!mockup) return;

    const onMove = (e: MouseEvent) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
      mockup.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateY(${
        Math.sin(Date.now() / 1000) * 10
      }px)`;
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      className="relative z-10 flex w-full flex-col items-center justify-center overflow-hidden py-16"
      id="hero-section"
    >
      {/* Arc positioned against text block height — not the full hero+mockup */}
      <div className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden">
        <div className="hero-arc-wrap">
          <div className="hero-glow" />
          <div className="hero-arc" />
        </div>

        <div className="landing-hero-content relative z-20 mx-auto mt-12 flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <p className="font-code-sm mb-2 text-[12px] font-semibold tracking-[0.2em] text-[#a855f7] uppercase">
            {privateBeta ? "CodeIT Private Beta" : "Welcome to CodeIT"}
          </p>
          <h1 className="font-headline-lg-mobile text-[48px] leading-[1.1] font-medium tracking-tight text-white drop-shadow-2xl md:font-headline-xl md:text-[84px]">
            Master Competitive <br className="hidden md:block" />
            Programming, Together.
          </h1>
          <p className="font-body-lg mt-4 max-w-3xl text-[16px] font-light text-white/60 md:text-[20px] md:leading-[32px]">
            {privateBeta
              ? "We're opening CodeIT to a small group of students first. Request access or sign in if you already have an invite."
              : "Practice coding problems. Learn DSA step by step. Challenge your friends. Compete in live contests. Get AI-powered guidance whenever you're stuck."}
          </p>

          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
            {privateBeta && !user ? (
              <>
                <Link
                  to="/request-access"
                  className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full bg-[#a855f7] px-10 py-4 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:bg-opacity-90 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] sm:w-auto"
                >
                  Request Beta Access
                </Link>
                <Link
                  to="/login"
                  className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-10 py-4 text-[15px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5 sm:w-auto"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/problems"
                  className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full bg-[#a855f7] px-10 py-4 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:bg-opacity-90 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] sm:w-auto"
                >
                  Start Coding
                </Link>
                <Link
                  to="/competitions/quick"
                  className="btn-glow font-body-md flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-10 py-4 text-[15px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5 sm:w-auto"
                >
                  Quick Clash
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {BADGES.map((label) => (
              <span
                key={label}
                className="font-body-sm flex cursor-default items-center gap-2 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-1.5 text-[13px] text-white/90 backdrop-blur-md transition-colors hover:bg-[#a855f7]/20"
              >
                <span className="material-symbols-outlined text-[16px] text-[#a855f7]">
                  check_circle
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={mockupRef}
        className="dashboard-mockup relative z-30 mt-24 w-full max-w-6xl px-4"
        id="hero-mockup"
      >
          <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-[#08080b]/90 p-2 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 p-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80 transition-colors hover:bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80 transition-colors hover:bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500/80 transition-colors hover:bg-green-500" />
              <div className="font-code-sm mx-auto ml-4 flex flex-1 items-center justify-center gap-2 rounded-md border border-white/5 bg-white/5 px-4 py-1 text-center text-[12px] text-white/50">
                <span className="material-symbols-outlined text-[14px]">
                  lock
                </span>{" "}
                codeit.dev/workspace
              </div>
            </div>

            <div className="grid h-[500px] grid-cols-12 gap-4">
              <div className="col-span-3 flex flex-col gap-4 rounded-lg border border-white/5 bg-white/5 p-4">
                <div className="h-8 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-5/6 rounded bg-white/5" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="mt-auto flex cursor-pointer items-center gap-3 rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/10 p-4 transition-colors hover:bg-[#a855f7]/20">
                  <span
                    className="material-symbols-outlined animate-bounce text-[#a855f7]"
                    style={{ animationDuration: "2s" }}
                  >
                    smart_toy
                  </span>
                  <div>
                    <div className="text-[12px] font-medium text-white">
                      AI Coach
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/50">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Ready to help
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-code-sm group relative col-span-6 rounded-lg border border-white/5 bg-[#050508] p-4 text-[13px]">
                <div className="mb-2 text-white/40">// Two Sum</div>
                <div className="text-[#a855f7]">
                  function <span className="text-blue-400">twoSum</span>(nums,
                  target) {"{"}
                </div>
                <div className="pl-4 text-white/70">const map = new Map();</div>
                <div className="pl-4 text-white/70">
                  for (let i = 0; i &lt; nums.length; i++) {"{"}
                </div>
                <div className="pl-8 text-white/70">
                  const complement = target - nums[i];
                </div>
                <div className="pl-8 text-[#a855f7]">
                  if <span className="text-white/70">(map.has(complement)) {"{"}</span>
                </div>
                <div className="pl-12 text-white/70">
                  return [map.get(complement), i];
                </div>
                <div className="pl-8 text-white/70">{"}"}</div>
                <div className="pl-8 text-white/70">
                  map.set(nums[i], i);
                  <span className="blinking-cursor" />
                </div>
                <div className="pl-4 text-white/70">{"}"}</div>
                <div className="text-white/70">{"}"}</div>
                <div className="absolute right-4 bottom-4 flex gap-2 opacity-50 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded bg-white/10 px-4 py-1.5 text-[12px] text-white transition-colors hover:bg-white/20"
                  >
                    Run
                  </button>
                  <button
                    type="button"
                    className="rounded bg-[#a855f7] px-4 py-1.5 text-[12px] font-medium text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-colors hover:bg-[#c084fc]"
                  >
                    Submit
                  </button>
                </div>
              </div>

              <div className="col-span-3 flex flex-col gap-4">
                <div className="group relative flex-1 overflow-hidden rounded-lg border border-white/5 bg-white/5 p-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-4 flex items-center gap-2 text-[13px] font-medium text-white">
                    <span className="material-symbols-outlined text-[16px] text-[#a855f7]">
                      swords
                    </span>{" "}
                    Quick Clash Lobby
                  </div>
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2 transition-colors hover:border-white/20">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-[10px] text-blue-300">
                          U1
                        </div>
                        <span className="text-[12px] text-white/70">User1</span>
                      </div>
                      <span className="flex items-center gap-1 text-[12px] text-green-400">
                        <div className="live-indicator" />
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-[#a855f7]/30 bg-[#a855f7]/5 p-2 transition-colors hover:border-[#a855f7]/60">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#a855f7]/20 text-[10px] text-[#a855f7]">
                          ME
                        </div>
                        <span className="text-[12px] font-medium text-white">
                          You
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[12px] text-green-400">
                        <div className="live-indicator" />
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10">
                  <div className="mb-4 flex items-center gap-2 text-[13px] font-medium text-white">
                    <span className="material-symbols-outlined text-[16px] text-[#a855f7]">
                      leaderboard
                    </span>{" "}
                    Live Ranks
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="group/rank flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[12px] font-medium text-yellow-500">
                          1.
                        </span>
                        <span className="text-[12px] text-white/70 transition-colors group-hover/rank:text-white">
                          Alex
                        </span>
                      </div>
                      <span className="font-code-sm text-[12px] text-white/70">
                        2400
                      </span>
                    </div>
                    <div className="group/rank flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[12px] font-medium text-gray-400">
                          2.
                        </span>
                        <span className="text-[12px] text-white/70 transition-colors group-hover/rank:text-white">
                          Sarah
                        </span>
                      </div>
                      <span className="font-code-sm text-[12px] text-white/70">
                        2350
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
