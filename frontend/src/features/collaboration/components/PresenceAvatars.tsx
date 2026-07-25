import type { RoomMember } from "../types";

type Props = {
  members: RoomMember[];
  onlineUserIds: number[];
  hostUserId: number;
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

export const AVATAR_COLORS = [
  "#f5a623",
  "#3b82f6",
  "#22c55e",
  "#ec4899",
  "#a78bfa",
  "#14b8a6",
];

export function avatarColorFor(userId: number): string {
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}

export default function PresenceAvatars({
  members,
  onlineUserIds,
  hostUserId,
  maxVisible = 5,
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

  const visible = sorted.slice(0, maxVisible);
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
          return (
            <div
              key={m.userId}
              title={`${m.username} · ${m.role}${isOnline ? " · online" : ""}`}
              className={`relative flex items-center justify-center rounded-full border-2 border-[var(--bg)] font-semibold text-[#0a0d12] ${size} ${
                isOnline ? "" : "opacity-45"
              }`}
              style={{
                background: avatarColorFor(m.userId),
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
