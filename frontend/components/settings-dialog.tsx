"use client";

import { useEffect, useState } from "react";
import { X, Monitor, Sun, Moon, Bell, Palette } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

const NOTIFY_KEY = "em-notify";

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(NOTIFY_KEY) !== "off";
}

const THEMES: { value: Theme; label: string; icon: any }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const [notify, setNotify] = useState(true);

  useEffect(() => { setNotify(notificationsEnabled()); }, [open]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    window.localStorage.setItem(NOTIFY_KEY, next ? "on" : "off");
    window.dispatchEvent(new Event("em-notify-change"));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Settings</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Appearance */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4 text-primary" /> Appearance</div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}
                >
                  <t.icon className="h-5 w-5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">“System” follows your device’s light/dark setting automatically.</p>
        </section>

        <div className="my-5 h-px bg-border" />

        {/* Notifications */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-primary" /> Notifications</div>
          <button
            onClick={toggleNotify}
            className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:bg-secondary/40"
          >
            <span className="text-sm">
              New quizzes & questions
              <span className="block text-xs text-muted-foreground">Get a badge on the bell when fresh content is added.</span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notify ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${notify ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
