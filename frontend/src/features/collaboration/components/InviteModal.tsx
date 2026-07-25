import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { copyText, roomCodeOf } from "../roomLinks";
import type { Room } from "../types";
import type { ConnectionState } from "./ConnectionStatus";
import ConnectionStatus from "./ConnectionStatus";
import PresenceAvatars from "./PresenceAvatars";

export type ShareMode = "created" | "in-room";

type Props = {
  open: boolean;
  room: Room | null;
  shareUrl: string;
  mode?: ShareMode;
  /** Create-flow primary CTA path */
  enterPath?: string;
  enterLabel?: string;
  subtitle?: string;
  onlineUserIds?: number[];
  connectionStatus?: ConnectionState;
  onClose: () => void;
};

function CopyButton({
  label,
  copiedLabel = "✓ Copied",
  onCopy,
}: {
  label: string;
  copiedLabel?: string;
  onCopy: () => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const ok = await onCopy();
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition duration-200 ${
        copied
          ? "border-[var(--ok)]/50 bg-[var(--ok)]/10 text-[var(--ok)]"
          : "border-[var(--line)] text-[var(--text)] hover:border-[var(--accent)]"
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export default function InviteModal({
  open,
  room,
  shareUrl,
  mode = "created",
  enterPath,
  enterLabel = "Enter room",
  subtitle,
  onlineUserIds,
  connectionStatus = "connected",
  onClose,
}: Props) {
  const navigate = useNavigate();
  const autoCopiedRef = useRef(false);
  const [linkCopiedHint, setLinkCopiedHint] = useState(false);

  const roomCode = room ? roomCodeOf(room) : "";
  const members = room?.members ?? [];
  const online = onlineUserIds ?? members.map((m) => m.userId);
  const onlineCount = members.filter((m) => online.includes(m.userId)).length;
  const alone = onlineCount <= 1;
  const title =
    mode === "created" ? "Collaboration started" : "Share this room";
  const sub =
    subtitle ||
    (mode === "created"
      ? "Invite friends to solve this problem together."
      : "Share the Room Code or link so friends can join.");

  useEffect(() => {
    if (!open || !shareUrl || autoCopiedRef.current) return;
    autoCopiedRef.current = true;
    void copyText(shareUrl).then((ok) => {
      if (ok) {
        setLinkCopiedHint(true);
        window.setTimeout(() => setLinkCopiedHint(false), 2000);
      }
    });
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) {
      autoCopiedRef.current = false;
      setLinkCopiedHint(false);
    }
  }, [open]);

  if (!open || !room) return null;

  // Portal to body so header backdrop-blur / overflow / Monaco layers cannot clip it
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 animate-[fadeIn_160ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-collab-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-xl transition duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="verdict-strip text-[var(--accent)]">Live session</p>
            <h2
              id="share-collab-title"
              className="mt-1 text-lg font-semibold text-[var(--text)]"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-dim)]">{sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ConnectionStatus status={connectionStatus} />
          <span className="text-xs text-[var(--text-dim)]">
            <span className="text-[var(--ok)]">●</span> {onlineCount} /{" "}
            {Math.max(members.length, 5)} Connected
          </span>
        </div>

        <div className="mt-3">
          <PresenceAvatars
            members={members}
            onlineUserIds={online}
            hostUserId={room.hostUserId}
          />
        </div>

        {alone && (
          <p className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-dim)]">
            Waiting for collaborators…
            <span className="mt-0.5 block text-xs">
              Share your invite link with friends.
            </span>
          </p>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
              Room Code
            </label>
            <div className="flex items-center gap-2">
              <code className="mono flex-1 truncate rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-sm tracking-wide text-[var(--accent)]">
                {roomCode}
              </code>
              <CopyButton
                label="Copy Room Code"
                onCopy={() => copyText(roomCode)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
              Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="mono min-w-0 flex-1 truncate rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2.5 text-xs text-[var(--text)]"
              />
              <CopyButton
                label={linkCopiedHint ? "✓ Copied" : "Copy Invite Link"}
                onCopy={async () => {
                  const ok = await copyText(shareUrl);
                  if (ok) setLinkCopiedHint(false);
                  return ok;
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {mode === "created" && enterPath ? (
            <button
              type="button"
              onClick={() => navigate(enterPath)}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] transition hover:brightness-110"
            >
              {enterLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0a0d12] transition hover:brightness-110"
            >
              Done
            </button>
          )}
          {mode === "created" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--text)]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
