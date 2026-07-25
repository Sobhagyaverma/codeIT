import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { RoomMessage } from "../types";
import { avatarColorFor } from "./PresenceAvatars";

type Props = {
  messages: RoomMessage[];
  onSend: (content: string) => Promise<void>;
  sending?: boolean;
  emptyHint?: string;
};

const EMOJIS = ["👍", "🔥", "✅", "😂", "🤔", "🎉", "👀", "💡"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function renderContent(content: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /```([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {content.slice(last, match.index)}
        </span>
      );
    }
    parts.push(
      <pre
        key={key++}
        className="mono my-1 overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1.5 text-[11px] text-[var(--text)]"
      >
        {match[1].replace(/^\n/, "").replace(/\n$/, "")}
      </pre>
    );
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {content.slice(last)}
      </span>
    );
  }
  return parts.length ? parts : content;
}

export default function RoomChat({
  messages,
  onSend,
  sending,
  emptyHint = "No messages yet. Say hi to the room.",
}: Props) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    setEmojiOpen(false);
    stickRef.current = true;
    await onSend(text);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-raised)]/40">
      <div className="border-b border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
        Chat
      </div>
      <div
        ref={listRef}
        onScroll={() => {
          const el = listRef.current;
          if (!el) return;
          const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          stickRef.current = nearBottom;
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 && (
          <p className="text-xs text-[var(--text-dim)]">{emptyHint}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2">
            <div
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#0a0d12]"
              style={{ background: avatarColorFor(m.userId) }}
            >
              {initials(m.username)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold text-[var(--text)]">
                  {m.username}
                </span>
                {m.createdAt && (
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {relativeTime(m.createdAt)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-sm text-[var(--text)]">
                {renderContent(m.content)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative flex gap-1.5 border-t border-[var(--line)] p-2"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm hover:border-[var(--accent)]"
            title="Emoji"
            aria-label="Insert emoji"
          >
            🙂
          </button>
          {emojiOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-1 flex flex-wrap gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-1.5 shadow-lg">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="rounded px-1.5 py-0.5 text-sm hover:bg-[var(--bg-inset)]"
                  onClick={() => {
                    setDraft((d) => d + e);
                    setEmojiOpen(false);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message… (``` for code)"
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0a0d12] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
