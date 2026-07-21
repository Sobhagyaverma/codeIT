import { Link } from "react-router-dom";
import type { ProfileIdentity } from "../types";
import { formatDate, initialsFromName } from "../format";

const PARTICLES = [
  { size: 4, left: "8%", top: "30%", color: "rgba(245,166,35,0.8)", duration: "8s", delay: "0s", driftX: "14px", driftY: "-12px" },
  { size: 3, left: "18%", top: "62%", color: "rgba(91,168,255,0.7)", duration: "11s", delay: "1.2s", driftX: "-10px", driftY: "-18px" },
  { size: 5, left: "34%", top: "22%", color: "rgba(255,255,255,0.5)", duration: "9s", delay: "0.6s", driftX: "12px", driftY: "10px" },
  { size: 3, left: "48%", top: "70%", color: "rgba(245,166,35,0.6)", duration: "12s", delay: "2s", driftX: "-14px", driftY: "-10px" },
  { size: 4, left: "62%", top: "35%", color: "rgba(168,108,255,0.6)", duration: "10s", delay: "0.9s", driftX: "10px", driftY: "-16px" },
  { size: 3, left: "74%", top: "58%", color: "rgba(91,168,255,0.6)", duration: "9s", delay: "1.6s", driftX: "-12px", driftY: "12px" },
  { size: 5, left: "86%", top: "28%", color: "rgba(245,166,35,0.7)", duration: "11s", delay: "0.3s", driftX: "-10px", driftY: "-14px" },
  { size: 2, left: "93%", top: "55%", color: "rgba(255,255,255,0.45)", duration: "8s", delay: "2.4s", driftX: "8px", driftY: "-10px" },
] as const;

export default function ProfileHeader({
  identity,
  isOwner,
}: {
  identity: ProfileIdentity;
  isOwner: boolean;
}) {
  const initials = initialsFromName(identity.name);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]">
      <div className="hero-cover h-28 sm:h-32">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="hero-particle"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              ["--duration" as string]: p.duration,
              ["--delay" as string]: p.delay,
              ["--drift-x" as string]: p.driftX,
              ["--drift-y" as string]: p.driftY,
            }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--bg-raised)] to-transparent" />
      </div>
      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {identity.avatarUrl ? (
              <div className="avatar-glow">
                <img
                  src={identity.avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-raised)] object-cover sm:h-24 sm:w-24"
                />
              </div>
            ) : (
              <div className="avatar-glow flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[var(--bg-raised)] bg-[var(--accent)] text-2xl font-bold text-[#0a0d12] sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
              </div>
            )}
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="display truncate text-2xl font-semibold sm:text-3xl">
                  {identity.name}
                </h1>
                <span className="verdict-strip rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[var(--accent)]">
                  {identity.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-dim)]">
                @{identity.username}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Link
                to="/settings/profile"
                className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--info)]"
              >
                Edit profile
              </Link>
              <Link
                to={`/users/${identity.username}`}
                className="rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
                title="Public profile URL"
              >
                Public URL
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm leading-relaxed text-[var(--text)]">
              {identity.bio ||
                "No bio yet. Tell others what you’re grinding on."}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-dim)]">
              {identity.location && <span>📍 {identity.location}</span>}
              {identity.joinedAt ? (
                <span>Joined {formatDate(identity.joinedAt)}</span>
              ) : null}
              {identity.showEmail && identity.email && (
                <span>{identity.email}</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-xs text-[var(--text-dim)]">
            <div className="verdict-strip mb-1 text-[var(--accent)]">
              Profile note
            </div>
            Public profiles show initials/avatar and hide email by default.
            Contest rating and achievements appear when available.
          </div>
        </div>
      </div>
    </section>
  );
}
