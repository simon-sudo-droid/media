"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "em-theme";

type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };
const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function apply(theme: Theme): "light" | "dark" {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || "dark";
    setThemeState(stored);
    setResolved(apply(stored));
  }, []);

  // React to OS theme changes while in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem(KEY, t);
    setThemeState(t);
    setResolved(apply(t));
  }

  return <Ctx.Provider value={{ theme, setTheme, resolved }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
