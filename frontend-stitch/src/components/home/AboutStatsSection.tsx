import type { Ref } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRegistration } from "../../context/RegistrationContext";
import { useCountUp } from "../../hooks/useCountUp";
import type { HomeStats } from "../../hooks/useHomeStats";

function MetricCard({
  value,
  label,
  suffix = "",
  staticValue,
}: {
  value?: number;
  label: string;
  suffix?: string;
  staticValue?: string;
}) {
  const { ref, value: animated } = useCountUp(value ?? 0, value != null);
  return (
    <div className="glass-card hover-lift relative z-10 flex h-[220px] flex-col items-center justify-center rounded-2xl p-8 text-center">
      <h3
        ref={ref as Ref<HTMLHeadingElement>}
        className={`font-headline-lg mb-2 flex items-center font-bold text-white ${
          staticValue === "Realtime" ? "text-[32px]" : "text-[40px]"
        }`}
      >
        {staticValue ?? (
          <>
            {animated}
            {suffix}
          </>
        )}
      </h3>
      <p className="font-body-sm text-[14px] text-white/50">{label}</p>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#a855f7]/5 to-transparent" />
    </div>
  );
}

export default function AboutStatsSection({ stats }: { stats: HomeStats }) {
  const { user } = useAuth();
  const { config } = useRegistration();
  const ctaTo = user
    ? "/problems"
    : config.privateBeta
      ? "/request-access"
      : "/register";
  const ctaLabel = user
    ? "Start Coding"
    : config.privateBeta
      ? "Request Access"
      : "Sign Up";

  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-center pr-12">
          <p className="font-code-sm mb-4 text-[12px] font-semibold tracking-[0.1em] text-white/50 uppercase">
            ABOUT CODEIT PLATFORM
          </p>
          <h2 className="font-headline-lg mb-6 text-[36px] leading-[1.2] font-medium text-white">
            Everything You Need To Become A Better Programmer
          </h2>
          <p className="font-body-md mb-8 leading-relaxed text-white/60">
            The ultimate environment for competitive programmers. Solve complex
            problems, participate in high-stakes contests, and master DSA with
            real-time feedback and a unified compiler suite.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={ctaTo}
              className="btn-glow font-body-sm rounded-full bg-[#a855f7] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all hover:bg-opacity-90"
            >
              {ctaLabel}
            </Link>
            <Link
              to="/about"
              className="font-body-sm rounded-full border border-white/20 bg-transparent px-8 py-3 text-[14px] font-semibold text-white transition-all hover:border-white/50 hover:bg-white/5"
            >
              LEARN MORE
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          <div className="grid-pattern pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-30" />
          <MetricCard
            value={stats.problemCount}
            suffix="+"
            label="Curated Problems"
          />
          <MetricCard
            value={stats.lessonCount}
            suffix="+"
            label="Learning Lessons"
          />
          <MetricCard staticValue="24/7" label="AI Personal Coding Coach" />
          <MetricCard
            staticValue="Realtime"
            label="Collaborative Rooms"
          />
        </div>
      </div>
    </section>
  );
}
