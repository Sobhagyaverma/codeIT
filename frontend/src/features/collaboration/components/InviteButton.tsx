import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/toast/ToastProvider";
import { createRoom } from "../api";
import { problemCollabShareUrl, roomCodeOf } from "../roomLinks";
import type { Room } from "../types";
import InviteModal from "./InviteModal";

type Props = {
  problemId: number;
  language?: string;
};

export default function InviteButton({ problemId, language = "java" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleInvite() {
    if (!user) {
      navigate("/login", { state: { from: `/problems/${problemId}` } });
      return;
    }
    setBusy(true);
    try {
      const created = await createRoom({
        type: "PROBLEM_COLLAB",
        problemId,
        language,
      });
      setRoom(created);
      setModalOpen(true);
    } catch (e) {
      pushToast(
        e instanceof Error ? e.message : "Failed to create room",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  const shareUrl =
    room != null
      ? problemCollabShareUrl(problemId, room.id, roomCodeOf(room))
      : "";

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInvite()}
        disabled={busy}
        title="Invite friends to solve together"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-1.5 text-sm text-[var(--text)] transition hover:border-[var(--accent)] disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        {busy ? "Creating…" : "Invite Friends"}
      </button>

      <InviteModal
        open={modalOpen}
        room={room}
        shareUrl={shareUrl}
        mode="created"
        subtitle="Invite friends to solve this problem together."
        enterPath={
          room
            ? `/problems/${problemId}/room/${room.id}`
            : `/problems/${problemId}`
        }
        onlineUserIds={room ? [room.hostUserId] : []}
        connectionStatus="connected"
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
