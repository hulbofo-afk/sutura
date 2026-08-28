"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

interface RegisterInput { name: string; brandName: string; email: string; password: string; city?: string; country?: string }
interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try { setUser(await apiFetch<User>("auth/me")); }
    catch { setUser(null); }
    finally { setReady(true); }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    async login(email, password) {
      const session = await apiFetch<{ user: User }>("auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setUser(session.user);
    },
    async register(input) {
      const session = await apiFetch<{ user: User }>("auth/register", { method: "POST", body: JSON.stringify(input) });
      setUser(session.user);
    },
    async logout() {
      try { await apiFetch("auth/logout", { method: "POST" }); } finally { setUser(null); }
    },
    refresh
  }), [ready, refresh, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
}
