"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "./api";

export type User = {
  id: number;
  email: string;
  full_name: string;
  xp: number;
  level: string;
  streak_days: number;
  is_admin?: boolean;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  switchAccount: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadUser() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { access_token } = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(access_token);
    await loadUser();
    router.push("/dashboard");
  }

  async function signup(email: string, password: string, fullName: string) {
    const { access_token } = await api<{ access_token: string }>("/auth/signup", {
      method: "POST",
      body: { email, password, full_name: fullName },
      auth: false,
    });
    setToken(access_token);
    await loadUser();
    router.push("/dashboard");
  }

  function logout() {
    clearToken();
    setUser(null);
    router.push("/");
  }

  // No multi-session support yet: switching accounts signs out and returns to login.
  function switchAccount() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, switchAccount, refresh: loadUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
