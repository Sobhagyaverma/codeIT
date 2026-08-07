export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

const LABEL: Record<ConnectionState, string> = {
  connecting: "Connecting",
  connected: "Live",
  disconnected: "Offline",
  reconnecting: "Reconnecting",
};

const DOT: Record<ConnectionState, string> = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  disconnected: "bg-red-400",
  reconnecting: "bg-amber-400 animate-pulse",
};

export default function ConnectionStatus({
  status,
}: {
  status: ConnectionState;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-label-md text-[12px] text-on-surface-variant"
      title={`Sync: ${LABEL[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT[status]}`} aria-hidden />
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
