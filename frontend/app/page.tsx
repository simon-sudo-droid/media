import Link from "next/link";
import {
  Sparkles, Brain, Trophy, Gauge, Palette, AudioLines, Type, Film,
  ScanSearch, Star, ArrowRight, Scissors, Wand2, Play, Github,
  Twitter, Youtube, Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Brain, title: "AI Mentor & Coach", desc: "Instant, expert feedback on your scripts, pacing, and storytelling decisions." },
  { icon: Film, title: "Learning Hub", desc: "Structured courses from foundations to cinematic, commercial & documentary editing." },
  { icon: ScanSearch, title: "Script-to-B-roll AI", desc: "Paste a script and get scene-by-scene b-roll, camera angles & motion-graphics ideas." },
  { icon: Gauge, title: "Daily Challenges", desc: "Build a streak with bite-sized challenges that sharpen real editing instincts." },
  { icon: Palette, title: "Color Grading Academy", desc: "Master exposure, skin tones, LUTs and cinematic looks with practical exercises." },
  { icon: Trophy, title: "Gamified Progress", desc: "Earn XP, climb levels, unlock badges and compete on the leaderboard." },
];

// Floating tiles around the hero — the tools an editor lives in.
const TILES = [
  { icon: Palette, x: "left-[8%]",  y: "top-[26%]",  d: "0s" },
  { icon: AudioLines, x: "left-[16%]", y: "top-[58%]", d: "0.8s" },
  { icon: Scissors, x: "left-[26%]", y: "top-[80%]", d: "1.4s" },
  { icon: Type, x: "right-[9%]",  y: "top-[24%]",  d: "0.4s" },
  { icon: Film, x: "right-[17%]", y: "top-[56%]", d: "1.1s" },
  { icon: ScanSearch, x: "right-[27%]", y: "top-[80%]", d: "1.8s" },
];

const LOGOS = ["Premiere Pro", "DaVinci Resolve", "Final Cut", "After Effects", "CapCut", "YouTube"];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-800 shadow-lg shadow-indigo-900/40">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight">
        EditMentor<span className="text-gradient"> AI</span>
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Nav */}
      <header className="relative z-20 border-b border-border/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm" className="pill">Log in</Button></Link>
            <Link href="/signup"><Button variant="gradient" size="sm" className="pill">Sign up free</Button></Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden">
        {/* Glowing horizon */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-24">
          <div className="absolute inset-0 horizon" />
          <div className="absolute inset-x-0 bottom-0 h-[70%] horizon-arc" />
        </div>

        {/* Floating tiles */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {TILES.map((t, i) => (
            <div key={i} className={`hero-tile animate-drift absolute h-14 w-14 ${t.x} ${t.y}`} style={{ animationDelay: t.d }}>
              <t.icon className="h-6 w-6 text-primary/80" />
            </div>
          ))}
        </div>

        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-primary/30 bg-background/40 py-1 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI mentor for video editors
          </Badge>
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Edit like a pro.
            <br />
            <span className="text-gradient">Learn without limits.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-muted-foreground">
            Duolingo for editing, MasterClass for skills, and Grammarly for your editing
            decisions — one AI-powered platform to learn, practice and level up daily.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="pill w-full bg-white text-black shadow-xl shadow-black/20 hover:bg-white/90 sm:w-auto">
                Start learning free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="pill w-full border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 sm:w-auto">
                <Play className="h-4 w-4" /> See how it works
              </Button>
            </Link>
          </div>
          <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
            Loved by editors building their craft
          </div>

          {/* Faint app mockup peeking up from the horizon */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="card-surface overflow-hidden rounded-t-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                <span className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="h-3 w-3 text-primary" /> EditMentor AI · Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 opacity-90">
                {[Wand2, Film, Trophy].map((I, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-left">
                    <I className="h-5 w-5 text-primary" />
                    <div className="mt-3 h-2 w-2/3 rounded bg-foreground/15" />
                    <div className="mt-2 h-2 w-1/2 rounded bg-foreground/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted by ───────────────────────────────────────── */}
      <section className="relative z-10 border-t border-border/50 py-10">
        <div className="container">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            The skills that transfer to every editor's toolkit
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {LOGOS.map((l) => (
              <span key={l} className="text-lg font-semibold text-muted-foreground/50">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="relative z-10 border-t border-border/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 rounded-full">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to level up</h2>
            <p className="mt-4 text-muted-foreground">A complete training system — not just videos to watch, but skills to practice.</p>
          </div>
          <div className="mt-14 grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="lift group transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/50 py-14">
        <div className="container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The AI-powered training platform that turns editors into world-class storytellers.
            </p>
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              {[Github, Twitter, Youtube, Instagram].map((I, i) => (
                <span key={i} className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:text-foreground">
                  <I className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          <FooterCol title="Product" links={["Features", "Learning Hub", "AI Tools", "Challenges"]} />
          <FooterCol title="Company" links={["About", "Careers", "Contact", "Blog"]} />
          <FooterCol title="Resources" links={["Guide & Help", "Glossary", "Changelog", "Community"]} />
        </div>
        <div className="container mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© 2026 EditMentor AI. Built for editors.</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l} className="transition-colors hover:text-foreground">{l}</li>
        ))}
      </ul>
    </div>
  );
}
