"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import IntroScene from "./scene";
import { introState } from "./state";

/* ── Content ─────────────────────────────────────────────── */
const CHAPTERS = [
  {
    label: "THE STORY",
    title: "IMPROVE YOUR EDITING SKILLS AND QUALITY OUTPUT",
    body: "Practice today's challenge, sharpen a skill in the Learning Hub, or let the AI tools plan your next cut.",
    range: [0.13, 0.36] as [number, number],
  },
  {
    label: "01 — DAILY CHALLENGES",
    title: "DAILY CHALLENGES",
    body: "Bite-size editing challenges that earn XP and build a streak.",
    range: [0.40, 0.52] as [number, number],
  },
  {
    label: "02 — LEARNING HUB",
    title: "LEARNING HUB",
    body: "Structured courses from Beginner to Professional.",
    range: [0.52, 0.64] as [number, number],
  },
  {
    label: "03 — AI TOOLS",
    title: "AI TOOLS",
    body: "AI that reviews your cuts and plans your next edit.",
    range: [0.64, 0.76] as [number, number],
  },
  {
    label: "04 — LEVEL PROGRESSION",
    title: "LEVEL PROGRESSION",
    body: "XP and skill levels: Beginner → Intermediate → Advanced → Professional.",
    range: [0.76, 0.87] as [number, number],
  },
];

const HOTSPOTS = [
  { label: "CHALLENGES", pos: { left: "20%", top: "62%" }, caption: "Bite-size daily challenges earn XP and keep your streak alive." },
  { label: "LEARNING HUB", pos: { left: "76%", top: "34%" }, caption: "An 8-week curriculum, books, glossary and quizzes — Beginner to Professional." },
  { label: "AI TOOLS", pos: { left: "68%", top: "70%" }, caption: "Script-to-B-roll, hook analysis and a senior-editor review of your cuts." },
  { label: "YOUR PROGRESS", pos: { left: "26%", top: "26%" }, caption: "Track XP, levels and real work in the analytics tracker." },
];

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$+*!?";

/* ── Scramble headline (decode-in on mount) ───────────────── */
function ScrambleTitle({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const iv = setInterval(() => {
      frame++;
      const locked = Math.floor(frame * 1.4);
      if (locked >= text.length) { clearInterval(iv); setDisplay(text); return; }
      let out = "";
      for (let i = 0; i < text.length; i++) {
        out += i < locked || text[i] === " " ? text[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      }
      setDisplay(out);
    }, 24);
    return () => clearInterval(iv);
  }, [text]);
  return <span className={className}>{display}</span>;
}

/* ── Hero headline with per-letter reveal ─────────────────── */
function Letters({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span aria-hidden className="inline-block">
      {text.split("").map((ch, i) => (
        <span key={i} className="letter-in" style={{ animationDelay: `${delay + i * 0.035}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

function Chapter({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="animate-in pointer-events-none absolute left-6 top-1/2 z-20 max-w-md -translate-y-1/2 md:left-16">
      <div className="text-[11px] font-light uppercase tracking-[0.4em] text-white/50">{label}</div>
      <h2 className="display-font mt-4 text-4xl uppercase leading-[0.95] text-white md:text-6xl">
        <ScrambleTitle text={title} />
      </h2>
      <p className="mt-5 max-w-sm text-sm font-light leading-relaxed tracking-wide text-white/60">{body}</p>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function CinematicIntro({ name }: { name: string }) {
  const [supported, setSupported] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const [pct, setPct] = useState(0);
  const [loaderGone, setLoaderGone] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [heroVisible, setHeroVisible] = useState(true);
  const [finale, setFinale] = useState(false);
  const [focus, setFocus] = useState(-1);
  const [frameloop, setFrameloop] = useState<"always" | "never" | "demand">("always");
  const wrapRef = useRef<HTMLElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const staticMode = reduced || !supported;
  const headline1 = `WELCOME BACK, ${name.toUpperCase()}.`;
  const headline2 = "LET'S MAKE YOUR BEST EDIT.";

  // Environment detection
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(window.matchMedia("(max-width: 768px), (hover: none)").matches);
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl2") && !c.getContext("webgl")) setSupported(false);
    } catch {
      setSupported(false);
    }
  }, []);

  // Preloader: ramp to 92 while the canvas boots, snap to 100 on ready.
  useEffect(() => {
    if (!supported) { setPct(100); return; }
    const iv = setInterval(() => setPct((p) => Math.min(p + 4 + Math.random() * 9, 92)), 80);
    return () => clearInterval(iv);
  }, [supported]);
  useEffect(() => {
    if (!ready) return;
    setPct(100);
    const t = setTimeout(() => setLoaderGone(true), 650);
    return () => clearTimeout(t);
  }, [ready]);

  // Scroll story: Lenis smooth scroll + pinned scrub
  useEffect(() => {
    if (staticMode || !wrapRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top top",
      end: "+=520%",
      pin: true,
      scrub: true,
      onUpdate(self) {
        const p = self.progress;
        introState.progress = p;
        setHeroVisible(p < 0.12);
        const fin = p > 0.885;
        setFinale(fin);
        if (!fin) { introState.focus = -1; setFocus(-1); }
        let idx = -1;
        for (let i = 0; i < CHAPTERS.length; i++) {
          if (p >= CHAPTERS[i].range[0] && p <= CHAPTERS[i].range[1]) { idx = i; break; }
        }
        setChapter(idx);
      },
    });

    const io = new IntersectionObserver(
      ([e]) => setFrameloop(e.isIntersecting ? "always" : "never"),
      { threshold: 0 },
    );
    io.observe(wrapRef.current);

    return () => {
      st.kill();
      io.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      introState.progress = 0;
      introState.focus = -1;
    };
  }, [staticMode]);

  // Pointer: parallax vars + custom cursor
  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      introState.px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      introState.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    const cur = cursorRef.current;
    if (cur) {
      cur.style.opacity = "1";
      cur.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }
  }
  function onLeave() {
    introState.px = 0;
    introState.py = 0;
    if (cursorRef.current) cursorRef.current.style.opacity = "0";
  }

  function pickHotspot(i: number) {
    const next = focus === i ? -1 : i;
    setFocus(next);
    introState.focus = next;
  }

  function enterDashboard() {
    const el = document.getElementById("dashboard-content");
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  /* ── Static fallback (no WebGL, or reduced motion) ──────── */
  if (staticMode) {
    return (
      <section className="no-reveal relative bg-[#050508] text-white" aria-label="EditMentor intro">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
          {supported ? (
            <div className="absolute inset-0">
              <IntroScene mobile={mobile} animate={false} frameloop="demand" onReady={() => setReady(true)} />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(55% 45% at 50% 55%, rgba(59,90,180,0.35), transparent 70%), radial-gradient(40% 30% at 30% 20%, rgba(90,110,220,0.18), transparent 70%)" }} />
          )}
          <div className="relative">
            <h1 className="display-font text-5xl uppercase leading-[0.95] md:text-7xl">{headline1}<br />{headline2}</h1>
            <p className="mt-6 text-xs font-light uppercase tracking-[0.4em] text-white/50">An AI mentor for video editors</p>
          </div>
        </div>
        {CHAPTERS.map((c) => (
          <div key={c.label} className="mx-auto max-w-3xl px-6 py-20">
            <div className="text-[11px] font-light uppercase tracking-[0.4em] text-white/50">{c.label}</div>
            <h2 className="display-font mt-3 text-4xl uppercase leading-[0.95] md:text-5xl">{c.title}</h2>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-white/60">{c.body}</p>
          </div>
        ))}
        <div className="flex justify-center pb-24">
          <button onClick={enterDashboard}
            className="rounded-full border border-white/25 bg-white/5 px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-colors hover:bg-white hover:text-black">
            Enter your dashboard ↓
          </button>
        </div>
      </section>
    );
  }

  /* ── Full scroll-driven experience ──────────────────────── */
  return (
    <section
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="no-reveal cursor-none-all relative h-screen overflow-hidden bg-[#050508] text-white"
      aria-label="EditMentor cinematic intro"
    >
      {/* WebGL scene */}
      <div className="absolute inset-0">
        <IntroScene mobile={mobile} animate frameloop={frameloop} onReady={() => setReady(true)} />
      </div>

      {/* Atmospheric glow, upper-left volumetric feel */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[65vh] w-[55vw] rounded-full bg-blue-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[35vh] w-[70vw] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Semantic outline for screen readers (visual chapters mount dynamically) */}
      <div className="sr-only">
        <h1>{headline1} {headline2}</h1>
        {CHAPTERS.map((c) => (<div key={c.label}><h2>{c.title}</h2><p>{c.body}</p></div>))}
      </div>

      {/* Vertical micro-label */}
      <div className="pointer-events-none absolute bottom-24 left-5 z-20 hidden text-[10px] font-light uppercase tracking-[0.45em] text-white/40 [writing-mode:vertical-rl] md:block">
        Scroll to discover
      </div>

      {/* SECTION 1 — hero headline */}
      <div className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center transition-opacity duration-500 ${heroVisible ? "opacity-100" : "opacity-0"}`}>
        <h1 className="display-font text-[10vw] uppercase leading-[0.92] md:text-[6.5vw]">
          <Letters text={headline1} delay={0.35} />
          <br />
          <Letters text={headline2} delay={0.35 + headline1.length * 0.035 + 0.15} />
        </h1>
        <p className="mt-7 text-[11px] font-light uppercase tracking-[0.45em] text-white/50 letter-in" style={{ animationDelay: "1.9s" }}>
          An AI mentor for video editors
        </p>
      </div>

      {/* SECTIONS 2–3 — pinned left chapters */}
      {chapter >= 0 && !finale && (
        <Chapter key={chapter} label={CHAPTERS[chapter].label} title={CHAPTERS[chapter].title} body={CHAPTERS[chapter].body} />
      )}

      {/* SECTION 4 — explorable finale */}
      <div className={`absolute inset-0 z-20 transition-opacity duration-700 ${finale ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {HOTSPOTS.map((h, i) => (
          <button
            key={h.label}
            onClick={() => pickHotspot(i)}
            style={h.pos}
            className={`group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 outline-none ${finale ? "" : "pointer-events-none"}`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-full border border-dashed transition-all group-focus-visible:ring-2 group-focus-visible:ring-amber-400 ${focus === i ? "border-amber-400 bg-amber-400/20" : "border-white/50 bg-white/5 group-hover:border-white"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${focus === i ? "bg-amber-400" : "bg-white/80"}`} />
            </span>
            <span className="text-[10px] font-light uppercase tracking-[0.3em] text-white/70 group-hover:text-white">{h.label}</span>
          </button>
        ))}

        {/* Caption card */}
        {focus >= 0 && (
          <div className="animate-in absolute bottom-24 left-6 z-30 max-w-sm rounded-xl border border-white/15 bg-black/60 p-5 backdrop-blur-xl md:left-16">
            <button
              onClick={() => pickHotspot(focus)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
            <div className="text-[10px] font-light uppercase tracking-[0.35em] text-amber-400">{HOTSPOTS[focus].label}</div>
            <p className="mt-2 pr-6 text-sm font-light leading-relaxed text-white/80">{HOTSPOTS[focus].caption}</p>
          </div>
        )}

        {/* Final CTA into the real dashboard */}
        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
          <button
            onClick={enterDashboard}
            className="rounded-full border border-white/25 bg-white/5 px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur transition-colors hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Enter your dashboard ↓
          </button>
        </div>
      </div>

      {/* Custom cursor */}
      <div ref={cursorRef} className="pointer-events-none fixed left-0 top-0 z-[60] opacity-0 mix-blend-difference" style={{ transition: "opacity 0.2s" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="-translate-x-0.5 -translate-y-0.5">
          <path d="M4 2l16 10-7 2-3 7z" />
        </svg>
      </div>

      {/* Preloader */}
      {!loaderGone && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508] transition-opacity duration-500 ${pct >= 100 ? "opacity-0" : "opacity-100"}`}>
          <div className="text-[10px] font-light uppercase tracking-[0.5em] text-white/50">EditMentor AI</div>
          <div className="display-font mt-3 text-5xl tabular-nums text-white">{Math.floor(pct)}%</div>
          <div className="mt-5 h-px w-40 overflow-hidden bg-white/15">
            <div className="h-full bg-amber-400 transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
