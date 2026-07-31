export type User = {
  id: number;
  name: string;
  uniqueUserId: string;
  email: string;
  role: "USER" | "ADMIN";
  token?: string;
};

export type ProblemPublicDTO = {
  id: number;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  topics: string[] | string;
  examples?: unknown;
  constraintsData?: string;
};

export type Submission = {
  id?: number;
  userId?: number;
  problemId: number;
  verdict?: string;
  createdAt?: string;
};

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: number;
};

export const AUTH_USER_KEY = "codeit.stitch.user";
export const AUTH_TOKEN_KEY = "codeit.stitch.token";
export const AUTH_PERSIST_KEY = "codeit.stitch.auth.persist";

function readPersistPreference(): boolean {
  const raw = localStorage.getItem(AUTH_PERSIST_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function getAuthStorage(persist?: boolean): Storage {
  return (persist ?? readPersistPreference()) ? localStorage : sessionStorage;
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
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(AUTH_USER_KEY);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      const token =
        typeof parsed.token === "string"
          ? parsed.token
          : storage.getItem(AUTH_TOKEN_KEY);
      if (!token || !parsed.user) {
        storage.removeItem(AUTH_USER_KEY);
        continue;
      }
      const expiresAt =
        typeof parsed.expiresAt === "number"
          ? parsed.expiresAt
          : Date.now() + 24 * 60 * 60 * 1000;
      if (expiresAt <= Date.now()) {
        storage.removeItem(AUTH_USER_KEY);
        storage.removeItem(AUTH_TOKEN_KEY);
        continue;
      }
      setAuthPersistPreference(storage === localStorage);
      return {
        user: { ...parsed.user, token },
        token,
        expiresAt,
      };
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
