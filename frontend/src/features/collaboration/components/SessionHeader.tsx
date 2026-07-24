import type { ReactNode } from "react";
import type { Room, WorkspaceType } from "../types";
import type { ConnectionState } from "./ConnectionStatus";
import ConnectionStatus from "./ConnectionStatus";
import PresenceAvatars from "./PresenceAvatars";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

type Props = {
  left: ReactNode;
  room: Room;
  onlineUserIds: number[];
  connectionStatus: ConnectionState;
  onInvite: () => void;
  actions?: ReactNode;
  workspace?: WorkspaceType;
  isHost?: boolean;
  onWorkspaceChange?: (workspace: WorkspaceType) => void;
  showWorkspaceSwitcher?: boolean;
};

export default function SessionHeader({
  left,
  room,
  onlineUserIds,
  connectionStatus,
  onInvite,
  actions,
  workspace,
  isHost = false,
  onWorkspaceChange,
  showWorkspaceSwitcher = false,
}: Props) {
  return (
    <header className="shrink-0 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="flex h-12 min-h-12 items-center gap-3 px-3 sm:px-4">
        {/* Left: back + title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>

        {/* Center: presence + live + invite */}
        <div className="hidden min-w-0 shrink-0 items-center justify-center gap-2 md:flex">
          {showWorkspaceSwitcher && workspace && onWorkspaceChange && (
            <WorkspaceSwitcher
              workspace={workspace}
              isHost={isHost}
              onChange={onWorkspaceChange}
            />
          )}
          <PresenceAvatars
            members={room.members}
            onlineUserIds={onlineUserIds}
            hostUserId={room.hostUserId}
            compact
          />
          <ConnectionStatus status={connectionStatus} />
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[#0a0d12] transition hover:brightness-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Invite
          </button>
        </div>

        {/* Right: language / run / submit */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <ConnectionStatus status={connectionStatus} />
            <button
              type="button"
              onClick={onInvite}
              className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-semibold text-[#0a0d12]"
            >
              Invite
            </button>
          </div>
          {actions}
        </div>
      </div>

      {/* Mobile: workspace + avatars row */}
      <div className="flex items-center gap-2 border-t border-[var(--line)] px-3 py-1.5 md:hidden">
        {showWorkspaceSwitcher && workspace && onWorkspaceChange && (
          <WorkspaceSwitcher
            workspace={workspace}
            isHost={isHost}
            onChange={onWorkspaceChange}
          />
        )}
        <PresenceAvatars
          members={room.members}
          onlineUserIds={onlineUserIds}
          hostUserId={room.hostUserId}
          compact
        />
      </div>
    </header>
  );
}
