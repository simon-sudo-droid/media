import Link from "next/link";
import {
  Sparkles, Brain, Trophy, Gauge, Palette, AudioLines, Type, Film,
  ScanSearch, Check, Star, ArrowRight, Quote,
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

const TESTIMONIALS = [
  { name: "Maya R.", role: "Freelance Editor", text: "Like Duolingo for editing. The daily challenges rewired how I think about cuts." },
  { name: "Daniel K.", role: "YouTube Creator", text: "The Script-to-B-roll tool alone saves me an hour per video. Wild." },
  { name: "Priya S.", role: "Agency Editor", text: "Finally a structured path from 'good enough' to genuinely cinematic." },
];

const PRICING = [
  { name: "Starter", price: "$0", tagline: "Everything, for everyone", features: ["All Foundations courses", "Daily challenges", "Unlimited AI tools", "Full progress tracking"], cta: "Get started free", highlight: false },
  { name: "Pro", price: "$0", tagline: "Free — no upgrade needed", features: ["All academies & courses", "Unlimited AI coaching", "Storytelling & Slide analyzers", "Leaderboards & badges", "Every new feature"], cta: "Get started free", highlight: true },
  { name: "Teams", price: "$0", tagline: "Free for studios & agencies", features: ["Everything in Pro", "Team progress dashboards", "Shared challenge sets", "Seats & roles", "Onboarding support"], cta: "Get started free", highlight: false },
];

const FAQ = [
  { q: "Do I need editing software to use EditMentor AI?", a: "No. EditMentor trains your editing decision-making and eye. You can apply what you learn in any editor — Premiere, DaVinci, Final Cut, CapCut." },
  { q: "Is it really like Duolingo for editing?", a: "Yes — short daily challenges, streaks, XP and levels keep you improving a little every day instead of cramming." },
  { q: "What do the AI tools do?", a: "Paste a script for instant b-roll and shot suggestions, get your storytelling scored, and have your slides critiqued — all with actionable feedback." },
  { q: "Can I use it for free?", a: "Yes — everything is free. All courses, academies, quizzes, challenges, and AI tools are fully unlocked for every account. No paid plans, no credit card." },
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
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
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

      {/* Testimonials */}
      <section className="relative z-10 border-t border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Editors are leveling up</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-primary/60" />
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">“{t.text}”</p>
                  <div className="mt-5">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 border-t border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">100% free, forever</h2>
            <p className="mt-4 text-muted-foreground">Every feature, every academy, every AI tool — no paywalls, no credit card, ever.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <Card key={p.name} className={p.highlight ? "relative border-primary/60 shadow-xl shadow-primary/10" : ""}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">Recommended</Badge>
                  </div>
                )}
                <CardContent className="p-7">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-muted-foreground">forever</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-7 block">
                    <Button variant={p.highlight ? "gradient" : "outline"} className="w-full">{p.cta}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 border-t border-border/60 py-24">
        <div className="container max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="mt-12 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-border bg-card p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
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
