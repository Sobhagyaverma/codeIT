import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../lib/types";
import {
  clearAuthStorage,
  getAuthPersistPreference,
  loadAuthSession,
  saveAuthSession,
  setAuthPersistPreference,
  type AuthSession,
} from "../lib/authStorage";

interface AuthState {
  user: User | null;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  setUser: (u: User | null) => void;
  establishSession: (params: {
    user: User;
    token: string;
    expiresInMs: number;
    rememberMe: boolean;
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function hydrateInitial(): AuthSession | null {
  try {
    return loadAuthSession();
  } catch {
    clearAuthStorage();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = hydrateInitial();
  const [user, setUserState] = useState<User | null>(initial?.user ?? null);
  const [rememberMe, setRememberMeState] = useState<boolean>(
    () => getAuthPersistPreference()
  );

  const setRememberMe = useCallback((value: boolean) => {
    setRememberMeState(value);
    setAuthPersistPreference(value);
  }, []);

  const setUser = useCallback((u: User | null) => {
    if (!u) {
      clearAuthStorage();
      setUserState(null);
      return;
    }
    setUserState(u);
  }, []);

  const establishSession = useCallback(
    ({
      user: nextUser,
      token,
      expiresInMs,
      rememberMe: persist,
    }: {
      user: User;
      token: string;
      expiresInMs: number;
      rememberMe: boolean;
    }) => {
      const session: AuthSession = {
        user: { ...nextUser, token },
        token,
        expiresAt: Date.now() + Math.max(expiresInMs, 60_000),
      };
      saveAuthSession(session, persist);
      setRememberMeState(persist);
      setUserState(session.user);
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      rememberMe,
      setRememberMe,
      setUser,
      establishSession,
      logout,
    }),
    [user, rememberMe, setRememberMe, setUser, establishSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
