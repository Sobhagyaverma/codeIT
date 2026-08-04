import type { Ref } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import type { HomeStats } from "../../hooks/useHomeStats";

function Counter({ target }: { target: number }) {
  const { ref, value } = useCountUp(target);
  return (
    <strong ref={ref as Ref<HTMLElement>} className="font-code-sm text-white">
      {value.toLocaleString()}
    </strong>
  );
}

export default function LiveStatsBanner({ stats }: { stats: HomeStats }) {
  return (
    <div className="reveal w-full border-y border-[#a855f7]/10 bg-[#a855f7]/5 py-4">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-around gap-4 px-6">
        <div className="flex items-center gap-3">
          <div className="live-indicator" />
          <span className="text-[14px] text-white/60">
            Users Online: <Counter target={stats.usersOnline} />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#a855f7]">
            check_circle
          </span>
          <span className="text-[14px] text-white/60">
            Problems Solved Today:{" "}
            <Counter target={stats.problemsSolvedToday} />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#a855f7]">
            emoji_events
          </span>
          <span className="text-[14px] text-white/60">
            Active Contests: <Counter target={stats.activeContestCount} />
          </span>
        </div>
      </div>
    </div>
  );
}
