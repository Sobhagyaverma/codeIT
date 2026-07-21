import { useEffect, useState } from "react";

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, total };
}

export default function CountdownTimer({
  targetIso,
  label,
  endedLabel = "00:00:00",
}: {
  targetIso: string;
  label: string;
  endedLabel?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = Date.parse(targetIso);
  const remaining = Number.isFinite(target) ? target - now : 0;
  const parts = split(remaining);
  const display =
    remaining <= 0
      ? endedLabel
      : parts.days > 0
        ? `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
        : `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
        {label}
      </div>
      <div className="mono mt-1 text-lg font-semibold tabular-nums text-[var(--text)]">
        {display}
      </div>
    </div>
  );
}
