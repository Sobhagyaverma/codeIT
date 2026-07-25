type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

const LABEL: Record<ConnectionState, string> = {
  connecting: "Connecting",
  connected: "Live",
  disconnected: "Offline",
  reconnecting: "Reconnecting",
};

const DOT: Record<ConnectionState, string> = {
  connecting: "bg-[var(--warn)]",
  connected: "bg-emerald-400",
  disconnected: "bg-[var(--err)]",
  reconnecting: "bg-[var(--warn)] animate-pulse",
};

export type { ConnectionState };

export default function ConnectionStatus({
  status,
}: {
  status: ConnectionState;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]"
      title={`Sync: ${LABEL[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
      {LABEL[status]}
    </span>
  );
}

export function mapProviderStatus(
  status: string | undefined
): ConnectionState {
  if (status === "connected") return "connected";
  if (status === "connecting") return "connecting";
  if (status === "disconnected") return "disconnected";
  return "reconnecting";
}
