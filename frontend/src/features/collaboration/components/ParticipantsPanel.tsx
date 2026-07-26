import type { RoomMember } from "../types";
import EmptyState from "../../../components/EmptyState";
import { avatarColorFor } from "../userColors";
import RoleBadge from "./RoleBadge";
import { Users } from "lucide-react";

type Props = {
  members: RoomMember[];
  onlineUserIds: number[];
  hostUserId: number;
  onInvite?: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ParticipantsPanel({
  members,
  onlineUserIds,
  hostUserId,
  onInvite,
}: Props) {
  const online = new Set(onlineUserIds);
  const onlineCount = members.filter((m) => online.has(m.userId)).length;
  const alone = onlineCount <= 1;
  const sorted = [...members].sort((a, b) => {
    if (a.userId === hostUserId) return -1;
    if (b.userId === hostUserId) return 1;
    const ao = online.has(a.userId) ? 0 : 1;
    const bo = online.has(b.userId) ? 0 : 1;
    return ao - bo || a.username.localeCompare(b.username);
  });

  return (
    <div className="border-b border-[var(--line)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          Participants
        </p>
        <span className="text-[10px] text-[var(--text-dim)]">
          <span className="text-emerald-400">●</span> {onlineCount} /{" "}
          {members.length} connected
        </span>
      </div>

      {alone && (
        <EmptyState
          icon={Users}
          title="Waiting for collaborators…"
          subtitle="Share your invite link with friends."
          size="sm"
          className="mb-2.5 rounded-lg bg-[var(--bg-inset)]/80"
          action={
            onInvite ? (
              <button
                type="button"
                onClick={onInvite}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
              >
                Open invite
              </button>
            ) : undefined
          }
        />
      )}

      <ul className="space-y-2">
        {sorted.map((m) => {
          const isOnline = online.has(m.userId);
          return (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-2 text-sm text-[var(--text)]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#0a0d12] ${
                    isOnline ? "" : "opacity-50"
                  }`}
                  style={{ background: avatarColorFor(m.userId) }}
                  title={isOnline ? "Online" : "Offline"}
                >
                  {initials(m.username)}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--bg-raised)] ${
                      isOnline ? "bg-emerald-400" : "bg-[var(--line)]"
                    }`}
                  />
                </span>
                <span className="min-w-0 truncate font-medium">
                  {m.username}
                </span>
              </span>
              <RoleBadge role={m.role} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
