import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../lib/types";


interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "codeit.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const setUser = (u: User | null) => setUserState(u);
  const logout = () => {
    setUserState(null);
    localStorage.removeItem("token");
  };
  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
