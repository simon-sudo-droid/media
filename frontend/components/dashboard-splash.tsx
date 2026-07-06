"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Branded loading splash shown once per session when the dashboard opens.
// Pure EditMentor animation (glass logo + rings + hints) — no external video.
const HINTS_LEFT = ["Cut", "Pacing", "B-roll", "Hook"];
const HINTS_RIGHT = ["Color", "Retention", "Story", "Export"];
const RINGS = [560, 420, 300, 190];

export function DashboardSplash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("em-splash")) return;   // once per session
    sessionStorage.setItem("em-splash", "1");
    setShow(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 500 : 2000;
    const t = setTimeout(() => setLeaving(true), dur);
    return () => clearTimeout(t);
  }, []);

  // Fade fully out shortly after `leaving` flips.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setShow(false), 600);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!show) return null;

  return (
    <div
      onClick={() => setLeaving(true)}
      className={`fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-[#0a0c24] transition-opacity duration-500 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      {/* Animated brand backdrop */}
      <div className="pointer-events-none absolute inset-0 glow" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 50%, hsl(224 80% 55% / 0.20), transparent 70%)" }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2">
        {RINGS.map((s) => (
          <div key={s} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" style={{ width: s, height: s }} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {HINTS_LEFT.map((h, i) => (
          <span key={h} className="animate-float absolute left-[13%] text-sm font-medium text-white/25" style={{ top: `${30 + i * 11}%`, animationDelay: `${i * 0.4}s` }}>{h}</span>
        ))}
        {HINTS_RIGHT.map((h, i) => (
          <span key={h} className="animate-float absolute right-[13%] text-sm font-medium text-white/25" style={{ top: `${32 + i * 11}%`, animationDelay: `${i * 0.5}s` }}>{h}</span>
        ))}
      </div>

      {/* Center brand */}
      <div className="animate-pop relative z-10 flex flex-col items-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-800 shadow-lg shadow-blue-900/50">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          EditMentor<span className="text-gradient"> AI</span>
        </h1>
        <p className="mt-2 text-sm text-white/70">Loading your editing studio…</p>
        <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/15">
          <div className="shimmer h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
        </div>
      </div>
    </div>
  );
}
