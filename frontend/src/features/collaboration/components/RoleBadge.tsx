import type { RoomRole } from "../types";

const ROLE_LABEL: Record<RoomRole, string> = {
  HOST: "Host",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const ROLE_CLASS: Record<RoomRole, string> = {
  HOST: "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]",
  EDITOR: "border-[var(--info)]/40 bg-[var(--info)]/10 text-[var(--info)]",
  VIEWER: "border-[var(--line)] bg-[var(--bg-inset)] text-[var(--text-dim)]",
};

export default function RoleBadge({ role }: { role: RoomRole }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ROLE_CLASS[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
