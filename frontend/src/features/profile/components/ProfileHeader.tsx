import { Link } from "react-router-dom";
import type { ProfileIdentity } from "../types";
import { formatDate, initialsFromName } from "../format";

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
      <div className="h-24 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--info)]/10 to-transparent sm:h-28" />
      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {identity.avatarUrl ? (
              <img
                src={identity.avatarUrl}
                alt=""
                className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-raised)] object-cover sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[var(--bg-raised)] bg-[var(--accent)] text-2xl font-bold text-[#0a0d12] sm:h-24 sm:w-24 sm:text-3xl">
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
              <span>
                Joined {formatDate(identity.joinedAt)}
                {identity.joinedAtSource === "demo" ? " · demo" : ""}
              </span>
              {identity.showEmail && <span>{identity.email}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-inset)] p-3 text-xs text-[var(--text-dim)]">
            <div className="verdict-strip mb-1 text-[var(--accent)]">
              Profile note
            </div>
            Public profiles show initials/avatar and hide email by default.
            Rating, streaks, and heatmap currently use labeled demo analytics
            until backend APIs ship.
          </div>
        </div>
      </div>
    </section>
  );
}
