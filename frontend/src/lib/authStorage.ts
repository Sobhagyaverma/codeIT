import type { User } from "./types";

export const AUTH_USER_KEY = "codeit.user";
export const AUTH_TOKEN_KEY = "token";
export const AUTH_PERSIST_KEY = "codeit.auth.persist";

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: number;
};

function readPersistPreference(): boolean {
  const raw = localStorage.getItem(AUTH_PERSIST_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function getAuthStorage(persist?: boolean): Storage {
  const shouldPersist = persist ?? readPersistPreference();
  return shouldPersist ? localStorage : sessionStorage;
}

export function setAuthPersistPreference(persist: boolean) {
  localStorage.setItem(AUTH_PERSIST_KEY, persist ? "1" : "0");
}

export function getAuthPersistPreference(): boolean {
  return readPersistPreference();
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function saveAuthSession(session: AuthSession, persist: boolean) {
  clearAuthStorage();
  setAuthPersistPreference(persist);
  const storage = getAuthStorage(persist);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(session));
  storage.setItem(AUTH_TOKEN_KEY, session.token);
}

export function loadAuthSession(): AuthSession | null {
  const candidates: Storage[] = [localStorage, sessionStorage];

  for (const storage of candidates) {
    const raw = storage.getItem(AUTH_USER_KEY);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as AuthSession | User;
      const token =
        "token" in parsed && typeof parsed.token === "string"
          ? parsed.token
          : storage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        storage.removeItem(AUTH_USER_KEY);
        continue;
      }

      const expiresAt =
        "expiresAt" in parsed && typeof parsed.expiresAt === "number"
          ? parsed.expiresAt
          : Date.now() + 24 * 60 * 60 * 1000;

      if (expiresAt <= Date.now()) {
        storage.removeItem(AUTH_USER_KEY);
        storage.removeItem(AUTH_TOKEN_KEY);
        continue;
      }

      const user: User =
        "user" in parsed && parsed.user
          ? (parsed.user as User)
          : (parsed as User);

      const session: AuthSession = {
        user: { ...user, token },
        token,
        expiresAt,
      };

      // Keep preference aligned with where we found the session.
      setAuthPersistPreference(storage === localStorage);
      return session;
    } catch {
      storage.removeItem(AUTH_USER_KEY);
      storage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  return null;
}

export function getAuthToken(): string | null {
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}
