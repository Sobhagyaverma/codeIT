/** Decouples api.ts from AuthContext to clear session on HTTP 401. */

type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(next: UnauthorizedHandler | null) {
  handler = next;
}

export function notifyUnauthorized() {
  handler?.();
}
