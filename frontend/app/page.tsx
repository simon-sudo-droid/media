import Link from "next/link";
import {
  Sparkles, Brain, Trophy, Gauge, Palette, AudioLines, Type, Film,
  ScanSearch, Star, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Brain, title: "AI Mentor & Coach", desc: "Get instant, expert feedback on your scripts, pacing, and storytelling decisions." },
  { icon: Film, title: "Learning Academy", desc: "Structured courses from foundations to cinematic, commercial & documentary editing." },
  { icon: ScanSearch, title: "Script-to-B-roll AI", desc: "Paste a script and get scene-by-scene b-roll, camera angles & motion graphics ideas." },
  { icon: Gauge, title: "Daily Challenges", desc: "Build a streak with bite-sized challenges that sharpen real editing instincts." },
  { icon: Palette, title: "Color Grading Academy", desc: "Master exposure, skin tones, LUTs and cinematic looks with practical exercises." },
  { icon: Trophy, title: "Gamified Progress", desc: "Earn XP, climb levels, unlock badges and compete on the leaderboard." },
];

const ACADEMIES = [
  { icon: AudioLines, label: "Audio" },
  { icon: Type, label: "Typography" },
  { icon: Palette, label: "Color" },
  { icon: Film, label: "Cinematic" },
  { icon: Gauge, label: "Pacing" },
  { icon: ScanSearch, label: "B-roll" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/30">
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0 glow" />

      {/* Nav */}
      <header className="relative z-10 border-b border-border/60 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/signup"><Button variant="gradient" size="sm">Sign up free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="container flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI mentor for video editors
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Become a <span className="text-gradient">world-class</span> video editor
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Duolingo for editing, MasterClass for skills, and Grammarly for your editing
            decisions — all in one AI-powered platform. Learn, practice, and level up daily.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Start learning free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Log in</Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
            Loved by editors building their craft
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 border-t border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to level up</h2>
            <p className="mt-4 text-muted-foreground">A complete training system — not just videos to watch, but skills to practice.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="group transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {ACADEMIES.map((a) => (
              <div key={a.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <a.icon className="h-4 w-4 text-primary" /> {a.label} Academy
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border/60 py-24">
        <div className="container">
          <Card className="relative overflow-hidden border-primary/30">
            <div className="absolute inset-0 glow" />
            <CardContent className="relative z-10 flex flex-col items-center gap-6 p-12 text-center">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                Your next edit could be your best one yet
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Join EditMentor AI and start building the skills of a world-class editor — one challenge at a time.
              </p>
              <Link href="/signup">
                <Button variant="gradient" size="lg">Create your free account <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <p>© 2026 EditMentor AI. Built for editors.</p>
        </div>
      </footer>
    </div>
  );
}
