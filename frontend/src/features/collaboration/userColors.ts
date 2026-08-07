/** Stable per-user palette for presence and Monaco remote cursors. */
export const USER_COLORS = [
  "#f5a623",
  "#3b82f6",
  "#22c55e",
  "#ec4899",
  "#a78bfa",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#f43f5e",
  "#0ea5e9",
  "#84cc16",
  "#d946ef",
] as const;

export function avatarColorFor(userId: number): string {
  return USER_COLORS[Math.abs(userId) % USER_COLORS.length];
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Inject per-client Monaco remote cursor/selection CSS from Yjs awareness. */
export function syncMonacoRemoteCursorStyles(
  awareness: {
    getStates: () => Map<number, Record<string, unknown>>;
    clientID: number;
  },
  styleElementId = "codeit-stitch-yjs-remote-cursors"
): void {
  let style = document.getElementById(styleElementId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleElementId;
    document.head.appendChild(style);
  }

  const rules: string[] = [];
  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID) return;
    const user = state.user as { name?: string; color?: string } | undefined;
    const color = user?.color || USER_COLORS[clientId % USER_COLORS.length];
    const name = (user?.name || "User").replace(/[\\"]/g, "");
    rules.push(`
.yRemoteSelection-${clientId} {
  background-color: ${colorWithAlpha(color, 0.28)};
}
.yRemoteSelectionHead-${clientId} {
  border-left: 2px solid ${color};
  border-color: ${color};
}
.yRemoteSelectionHead-${clientId}::after {
  content: "${name}";
  position: absolute;
  top: -1.4em;
  left: -2px;
  padding: 0 4px;
  border-radius: 3px 3px 3px 0;
  background: ${color};
  color: #0a0d12;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
}
`);
  });
  style.textContent = rules.join("\n");
}
