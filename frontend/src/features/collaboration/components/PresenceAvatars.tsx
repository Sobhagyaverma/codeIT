import type { RoomMember } from "../types";
import { avatarColorFor } from "../userColors";

export { avatarColorFor, USER_COLORS as AVATAR_COLORS } from "../userColors";

type Props = {
  members: RoomMember[];
  onlineUserIds: number[];
  hostUserId: number;
  /** Omit or pass a large number to show every member */
  maxVisible?: number;
  compact?: boolean;
  /** Vertical stack for collapsed rail */
  vertical?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PresenceAvatars({
  members,
  onlineUserIds,
  hostUserId,
  maxVisible,
  compact = false,
  vertical = false,
}: Props) {
  const online = new Set(onlineUserIds);
  const sorted = [...members].sort((a, b) => {
    const ao = online.has(a.userId) ? 0 : 1;
    const bo = online.has(b.userId) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    if (a.userId === hostUserId) return -1;
    if (b.userId === hostUserId) return 1;
    return a.username.localeCompare(b.username);
  });

  const limit = maxVisible ?? sorted.length;
  const visible = sorted.slice(0, limit);
  const overflow = sorted.length - visible.length;
  const onlineCount = members.filter((m) => online.has(m.userId)).length;
  const size = compact ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]";

  return (
    <div
      className={`flex items-center gap-2 ${vertical ? "flex-col" : ""}`}
    >
      <div className={`flex ${vertical ? "flex-col gap-1.5" : "-space-x-2"}`}>
        {visible.map((m, i) => {
          const isOnline = online.has(m.userId);
          const color = avatarColorFor(m.userId);
          return (
            <div
              key={m.userId}
              title={`${m.username} · ${m.role}${isOnline ? " · online" : ""}`}
              className={`relative flex items-center justify-center rounded-full border-2 border-[var(--bg)] font-semibold text-[#0a0d12] ${size} ${
                isOnline ? "" : "opacity-45"
              }`}
              style={{
                background: color,
                boxShadow: `0 0 0 1px ${color}`,
                zIndex: vertical ? 1 : visible.length - i,
              }}
            >
              {initials(m.username)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--bg)] ${
                  isOnline ? "bg-emerald-400" : "bg-[var(--line)]"
                }`}
              />
            </div>
          );
        })}
        {overflow > 0 && !vertical && (
          <div
            className={`flex items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--bg-inset)] font-semibold text-[var(--text-dim)] ${size}`}
            title={sorted
              .slice(limit)
              .map((m) => m.username)
              .join(", ")}
          >
            +{overflow}
          </div>
        )}
      </div>
      {!compact && !vertical && (
        <span className="text-[10px] text-[var(--text-dim)]">
          {onlineCount}/{members.length} online
        </span>
      )}
    </div>
  );
}
