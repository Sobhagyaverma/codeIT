/**
 * Runtime URLs for API / STOMP / Yjs.
 *
 * Same-origin strategy (Nginx prod + Vite proxy locally):
 * - Leave VITE_API_URL empty → `/api` and `/ws` hit the current host
 * - Leave VITE_SYNC_WS_URL empty → `ws(s)://{host}/sync` (Vite proxies /sync → :1234;
 *   Nginx should proxy /sync → sync-server in production)
 */
export function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "";
}

export function resolveSyncWsUrl(): string {
  const fromEnv = (import.meta.env.VITE_SYNC_WS_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.host) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/sync`;
  }

  // Non-browser fallback (tests / SSR)
  return "ws://localhost:1234";
}
