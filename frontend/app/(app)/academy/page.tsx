"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import {
  BookOpen, GraduationCap, Library, Search, Plus, ExternalLink, Loader2,
  Target, Eye, Dumbbell, ListChecks, Flame, ArrowRight, ArrowLeft, X, Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChallengeCard, type Challenge } from "@/components/challenge-card";
import { PageHero } from "@/components/page-hero";
import { WEEKS } from "@/lib/mastery";

const HUB_TILES = [
  { icon: Target, x: "left-[9%]", y: "top-[28%]", d: "0s" },
  { icon: Library, x: "left-[16%]", y: "top-[66%]", d: "0.9s" },
  { icon: BookOpen, x: "right-[10%]", y: "top-[26%]", d: "0.5s" },
  { icon: Flame, x: "right-[17%]", y: "top-[66%]", d: "1.3s" },
];

/* ── Tab 1: Marketing Mastery — deep curriculum lives in lib/mastery.ts ── */

/* ── Tab 2: Books & Courses ────────────────────────────────── */
const googleBook = (title: string, author: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${title} ${author !== "—" ? author : ""} book`)}`;

const BOOK_THEMES = [
  { theme: "Craft & Theory", books: [
    { title: "In the Blink of an Eye", author: "Walter Murch", note: "The legendary editor's philosophy of the cut and why emotion comes first." },
    { title: "The Technique of Film & Video Editing", author: "Ken Dancyger", note: "A deep, historical grounding in editing theory and practice." },
  ]},
  { theme: "Storytelling & Pacing", books: [
    { title: "Edit Better", author: "Jeff Bartsch", note: "Practical storytelling-first editing for modern content creators." },
    { title: "Cut to the Chase", author: "Bobbie O'Steen", note: "Editors dissect how pacing and structure shape a scene." },
  ]},
  { theme: "Documentary Editing", books: [
    { title: "Documentary Editing: Principles & Practice", author: "—", note: "Shaping truth: interview-driven structure and narrative arcs." },
    { title: "First Cut: Conversations with Film Editors", author: "Gabriella Oldham", note: "Master editors on their craft and decision-making." },
  ]},
  { theme: "Technique & Workflow", books: [
    { title: "The Healthy Edit", author: "John Rosenberg", note: "Fixing story problems in the edit — trims, restructures, and rescues." },
    { title: "The Filmmaker's Handbook", author: "Steven Ascher & Edward Pincus", note: "The end-to-end reference for production and post workflow." },
  ]},
  { theme: "B-Roll & Coverage", books: [
    { title: "Grammar of the Edit", author: "Roy Thompson & Christopher Bowen", note: "Continuity, coverage, and the visual grammar behind shot choices." },
  ]},
];

const udemy = (q: string) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`;
const COURSES = [
  { title: "The Complete Adobe Premiere Pro Video Editing Bootcamp", by: "Louay Zambakji · Udemy", tag: "Paid", url: udemy("Complete Adobe Premiere Pro Video Editing Bootcamp Louay Zambakji") },
  { title: "Video Editing Masterclass: Edit Your Videos Like a Pro", by: "Julian Melanson · Udemy", tag: "Paid", url: udemy("Video Editing Masterclass Julian Melanson") },
  { title: "Premiere Pro Essentials & Advanced Training", by: "Daniel Walter Scott · Udemy", tag: "Paid", url: udemy("Premiere Pro Daniel Walter Scott") },
  { title: "Complete Adobe Premiere Pro Megacourse: Beginner to Expert", by: "Creativity Unleashed · Udemy", tag: "Paid", url: udemy("Complete Adobe Premiere Pro Megacourse Beginner to Expert") },
  { title: "50+ Generative AI Tools to 10x Business, Productivity, Creativity", by: "Julian Melanson & Benza Maman · Udemy", tag: "Paid", url: udemy("50+ Generative AI Tools Julian Melanson") },
  { title: "Learn Prompting", by: "learnprompting.thinkific.com", tag: "Free+Paid", url: "https://learnprompting.thinkific.com/" },
];
const TAG_VARIANT: Record<string, "success" | "warning" | "default"> = { "Free": "success", "Paid": "warning", "Free+Paid": "default" };

/* ── Tab 3: Glossary (dictionary) ──────────────────────────── */
type Dict = { term: string; meaning: string; example: string; category: string };
const DICTIONARY: Dict[] = [
  { term: "B-roll", category: "Video", meaning: "Supplementary footage cut over the main shot or narration to add context and cover edits.", example: "Cutting to hands typing while the host says “we worked late into the night.”" },
  { term: "A-roll", category: "Video", meaning: "Your primary footage — usually the talking head or main subject that carries the story.", example: "The interview take the whole edit is built around." },
  { term: "J-cut", category: "Video", meaning: "The audio of the next clip starts before its video, pulling the viewer forward.", example: "You hear the next scene's dialogue a second before you see it." },
  { term: "L-cut", category: "Video", meaning: "The audio of the current clip continues over the video of the next one.", example: "A speaker's voice carries over a cutaway to the audience." },
  { term: "Jump cut", category: "Video", meaning: "A cut between two similar shots that jumps in time.", example: "Trimming pauses from a talking head so it 'jumps' forward." },
  { term: "Match cut", category: "Video", meaning: "A cut between two shots linked by similar composition or motion.", example: "A spinning wheel cuts to a spinning record." },
  { term: "Cutaway", category: "Video", meaning: "A shot of something other than the main subject, used for detail or to hide an edit.", example: "Cutting from the interview to a close-up of a ringing phone." },
  { term: "Montage", category: "Video", meaning: "A sequence of short shots edited to compress time or show progress.", example: "A training montage covering weeks in 20 seconds." },
  { term: "Cross-dissolve", category: "Video", meaning: "A transition where one shot fades into the next; signals a time or place change.", example: "Dissolving from day to night over a skyline." },
  { term: "Color grading", category: "Video", meaning: "Creatively adjusting color and tone to set mood and a consistent look.", example: "Warm, lifted blacks for a nostalgic memory scene." },
  { term: "LUT", category: "Video", meaning: "Look-Up Table — a preset mapping input colors to output colors to apply a look.", example: "Applying a teal-and-orange LUT as a starting point." },
  { term: "Keyframe", category: "Video", meaning: "A marker setting a value at a point in time so it animates between markers.", example: "Keyframing opacity 0→100 to fade in a title." },
  { term: "Proxy", category: "Video", meaning: "A lightweight copy of footage for smooth editing; swapped for the original at export.", example: "Editing 4K on a laptop using 720p proxies." },
  { term: "Aspect ratio", category: "Video", meaning: "The width-to-height ratio of the frame.", example: "16:9 for YouTube, 9:16 for Reels/Shorts." },
  { term: "Frame rate", category: "Video", meaning: "How many frames are shown per second (fps).", example: "Shooting 60fps to get smooth slow motion in a 24fps timeline." },
  { term: "Speed ramp", category: "Video", meaning: "Smoothly changing playback speed within a clip.", example: "Ramping from slow-mo into real-time on an action beat." },
  { term: "Lower third", category: "Video", meaning: "A graphic in the lower part of the frame showing a name or caption.", example: "A guest's name and title sliding in during an interview." },
  { term: "Audio ducking", category: "Audio", meaning: "Automatically lowering music when speech plays so dialogue stays clear.", example: "Music drops ~12 dB whenever the host talks." },
  { term: "Sound bed", category: "Audio", meaning: "A background music or ambience layer running under the main audio.", example: "A soft ambient pad under a voiceover." },
  { term: "Room tone", category: "Audio", meaning: "The ambient sound of a location, used to smooth audio edits.", example: "Laying room tone under cuts so silence doesn't 'pop'." },
  { term: "LUFS", category: "Podcast", meaning: "Loudness Units Full Scale — the standard for perceived loudness.", example: "Mastering a podcast to −16 LUFS for consistent volume." },
  { term: "Noise floor", category: "Audio", meaning: "The level of constant background noise in a recording.", example: "A high noise floor = audible hiss under the voice." },
  { term: "De-esser", category: "Audio", meaning: "A processor that tames harsh 's' and 't' sounds.", example: "De-essing a sibilant narrator." },
  { term: "Waveform", category: "Audio", meaning: "The visual shape of audio amplitude over time.", example: "Cutting on the waveform to trim silence precisely." },
  { term: "Filler words", category: "Podcast", meaning: "Ums, uhs, and repeated phrases removed to tighten speech.", example: "Cutting every 'um' from a podcast clip." },
  { term: "Thumbnail", category: "Thumbnail", meaning: "The clickable cover image representing a video.", example: "A bold face + 3-word text thumbnail for a YouTube video." },
  { term: "Focal point", category: "Thumbnail", meaning: "The element the eye lands on first in a frame or thumbnail.", example: "A surprised face as the clear focal point." },
  { term: "Rule of thirds", category: "Thumbnail", meaning: "Placing key elements along thirds of the frame for balance.", example: "Subject's eyes on the upper-third line." },
  { term: "Safe area", category: "Thumbnail", meaning: "The zone kept clear of edges so nothing important gets cropped.", example: "Keeping text inside the safe area for all devices." },
];

const TABS = [
  { key: "mastery", label: "Marketing Mastery", icon: Target },
  { key: "library", label: "Books & Courses", icon: Library },
  { key: "glossary", label: "Glossary", icon: BookOpen },
  { key: "practice", label: "Quizzes & Challenges", icon: Flame },
];

export default function LearningHubPage() {
  const [tab, setTab] = useState("mastery");
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHero
        eyebrow="Learning Hub"
        icon={GraduationCap}
        title={<>Get better <span className="text-gradient">every week</span></>}
        subtitle="The path, the library, the language, and the practice — everything to sharpen your craft."
        tiles={HUB_TILES}
      />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "mastery" && <Mastery />}
      {tab === "library" && <Library_ />}
      {tab === "glossary" && <Glossary />}
      {tab === "practice" && <Practice />}
    </div>
  );
}

function Mastery() {
  const [sel, setSel] = useState<number | null>(null);
  const w = WEEKS.find((x) => x.week === sel);

  if (w) {
    return (
      <div className="space-y-5 animate-in">
        <button onClick={() => setSel(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to all weeks
        </button>

        {/* Week header: overview + goal + practice/watch/learn */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">W{w.week}</span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{w.title}</h2>
                <p className="text-sm text-muted-foreground">{w.summary}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/90">{w.overview}</p>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/10 p-3.5">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed"><span className="font-semibold text-primary">Your goal this week: </span>{w.goal}</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MasteryCell icon={Dumbbell} label="Practice" text={w.practice} />
              <MasteryCell icon={Eye} label="Watch" text={w.watch} />
              <MasteryCell icon={GraduationCap} label="Learn" text={w.learn} />
            </div>
          </CardContent>
        </Card>

        {/* Deep-dive lessons */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Deep-dive lessons</h3>
          </div>
          <div className="space-y-3">
            {w.lessons.map((l, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h4 className="font-semibold"><span className="text-primary">Lesson {i + 1} · </span>{l.heading}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{l.body}</p>
                  <ul className="mt-3 space-y-1.5">
                    {l.points.map((p, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* This week's drill */}
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">This week&apos;s drill</h3>
            </div>
            <ol className="space-y-2.5">
              {w.drill.map((d, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="leading-relaxed text-foreground/90">{d}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Scenarios — full anatomy */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">5 real-world scenarios</h3>
            <span className="text-sm text-muted-foreground">— the fix, why it works, the steps, and the trap</span>
          </div>
          <div className="space-y-3">
            {w.scenarios.map((s, i) => (
              <Card key={i} className="lift">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Situation: </span>{s.situation}</p>
                      <p className="mt-1.5 text-sm text-foreground/90"><span className="font-medium text-primary">Do this: </span>{s.approach}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Why it works: </span>{s.why}</p>
                      <div className="mt-3 rounded-lg bg-secondary/40 p-3">
                        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step by step</div>
                        <ol className="space-y-1.5">
                          {s.steps.map((st, si) => (
                            <li key={si} className="flex items-start gap-2 text-sm text-foreground/90">
                              <span className="mt-0.5 shrink-0 font-semibold text-primary">{si + 1}.</span> {st}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <p className="mt-2.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                        <span><span className="font-medium text-rose-400">Avoid: </span>{s.pitfall}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key takeaways */}
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Key takeaways</h3>
            </div>
            <ul className="space-y-2">
              {w.takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger">
      <p className="text-sm text-muted-foreground">An 8-week deep-dive curriculum for editors. Click any week for the full lesson — overview, goal, 3 deep-dive lessons, a step-by-step drill, 5 real-world scenarios (with the why, the steps, and the pitfall), and key takeaways.</p>
      {WEEKS.map((wk) => (
        <button key={wk.week} onClick={() => setSel(wk.week)} className="block w-full text-left">
          <Card className="lift">
            <CardContent className="flex items-center gap-3 p-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">W{wk.week}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{wk.title}</h3>
                <p className="truncate text-sm text-muted-foreground">{wk.summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">{wk.lessons.length} lessons · drill · {wk.scenarios.length} scenarios · takeaways</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">Learn more <ArrowRight className="h-4 w-4" /></span>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
function MasteryCell({ icon: Icon, label, text }: { icon: any; label: string; text: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</div>
      <p className="text-sm text-foreground/90">{text}</p>
    </div>
  );
}

function Library_() {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        {BOOK_THEMES.map((group) => (
          <section key={group.theme} className="space-y-3">
            <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">{group.theme}</h2><div className="h-px flex-1 bg-border" /></div>
            <div className="grid gap-4 stagger sm:grid-cols-2 lg:grid-cols-3">
              {group.books.map((b) => (
                <Card key={b.title} className="lift h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    <BookOpen className="mb-3 h-5 w-5 text-primary" />
                    <h3 className="font-semibold leading-snug">{b.title}</h3>
                    {b.author !== "—" && <p className="text-xs text-muted-foreground">{b.author}</p>}
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.note}</p>
                    <a href={googleBook(b.title, b.author)} target="_blank" rel="noopener noreferrer" className="mt-3">
                      <Button variant="outline" size="sm" className="w-full gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Visit</Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="space-y-3">
        <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">Courses & Platforms</h2><div className="h-px flex-1 bg-border" /></div>
        <div className="grid gap-4 stagger sm:grid-cols-2">
          {COURSES.map((c) => (
            <Card key={c.title} className="lift">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold leading-snug">{c.title}</h3><Badge variant={TAG_VARIANT[c.tag]}>{c.tag}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.by}</p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Visit</Button></a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

type Term = { id: number; term: string; definition: string; created_at: string };
function Glossary() {
  const [userTerms, setUserTerms] = useState<Dict[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Dict | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<Term[]>("/glossary").then((rows) =>
      setUserTerms(rows.map((r) => ({ term: r.term, meaning: r.definition, example: "", category: "Community" })))
    ).catch(() => {});
  }
  useEffect(load, []);

  // Community terms first (newest additions), then the built-in dictionary.
  const all = useMemo(() => {
    const seen = new Set<string>();
    const merged: Dict[] = [];
    for (const t of [...userTerms, ...DICTIONARY]) {
      const k = t.term.toLowerCase();
      if (!seen.has(k)) { seen.add(k); merged.push(t); }
    }
    return merged;
  }, [userTerms]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter((t) => t.term.toLowerCase().includes(n) || t.meaning.toLowerCase().includes(n) || t.example.toLowerCase().includes(n));
  }, [q, all]);

  // Exact-ish match shows as the headline definition (dictionary feel).
  const headline = selected || (q.trim() ? filtered.find((t) => t.term.toLowerCase() === q.trim().toLowerCase()) || filtered[0] : null);

  async function add() {
    if (!newTerm.trim() || !newDef.trim()) return;
    setBusy(true);
    try {
      await api("/glossary", { method: "POST", body: { term: newTerm, definition: newDef } });
      setNewTerm(""); setNewDef(""); setAdding(false); load();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }} placeholder="Search any editing, audio, podcast, or thumbnail term…"
            className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <Button variant="gradient" onClick={() => setAdding((v) => !v)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Term</Button>
      </div>

      {adding && (
        <Card className="animate-in"><CardContent className="space-y-3 p-5">
          <input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Term (e.g. Whip pan)" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <textarea value={newDef} onChange={(e) => setNewDef(e.target.value)} placeholder="Definition…" className="min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" disabled={busy || !newTerm.trim() || !newDef.trim()} onClick={add}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save term</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Dictionary headline definition */}
      {headline && (
        <Card className="border-primary/30 animate-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-primary">{headline.term}</h2>
                  <Badge variant="secondary">{headline.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-foreground/90"><span className="font-medium">Meaning: </span>{headline.meaning}</p>
                {headline.example && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Example: </span>{headline.example}</p>}
              </div>
              {selected && <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related / popular searches */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {q.trim() ? "Related searches" : "Popular searches"}
        </div>
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => (
            <button key={t.term} onClick={() => setSelected(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${headline?.term === t.term ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
              {t.term}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No terms match “{q}”. Try “+ Add Term” to define it.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Tab 4: Quizzes & Challenges ───────────────────────────── */
type Course = { id: number; slug: string; title: string; description: string; level: string; category: string; icon: string; lesson_count: number; completed_count: number };
type Quiz = { id: number; slug: string; title: string; topic: string; level: string; description: string; question_count: number };
const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "policy"];
const LEVEL_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", policy: "Company Policy" };

function Practice() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  function loadCh() { api<Challenge[]>("/challenges").then(setChallenges).catch(() => {}); }
  useEffect(() => {
    api<Course[]>("/courses").then(setCourses).catch(() => {});
    api<Quiz[]>("/quizzes").then(setQuizzes).catch(() => {});
    loadCh();
  }, []);

  const grouped = LEVEL_ORDER.map((l) => ({ level: l, items: courses.filter((c) => c.level === l) })).filter((g) => g.items.length);
  const KIND_LABEL: Record<string, string> = { daily: "Daily", broll: "B-roll", editing: "Editing" };
  const chGrouped = ["daily", "broll", "editing"].map((k) => ({ kind: k, items: challenges.filter((c) => c.kind === k) })).filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      {/* Courses */}
      {grouped.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Courses</h2></div>
          {grouped.map((g) => (
            <div key={g.level} className="space-y-3">
              <div className="flex items-center gap-3"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{LEVEL_LABEL[g.level]}</h3><div className="h-px flex-1 bg-border" /></div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => {
                  const Icon = (Icons as any)[c.icon] || Icons.GraduationCap;
                  const pct = c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
                  return (
                    <Link key={c.id} href={`/academy/${c.slug}`}>
                      <Card className="lift h-full"><CardContent className="flex h-full flex-col p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                          <Badge variant="secondary">{LEVEL_LABEL[c.level]}</Badge>
                        </div>
                        <h4 className="font-semibold">{c.title}</h4>
                        <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                        <div className="mt-4 space-y-2"><Progress value={pct} /><div className="text-xs text-muted-foreground">{c.completed_count}/{c.lesson_count} lessons</div></div>
                      </CardContent></Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Quizzes</h2></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <Link key={q.id} href={`/quizzes/${q.slug}`}>
                <Card className="lift h-full"><CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary"><ListChecks className="h-5 w-5" /></div>
                    <Badge variant="secondary" className="capitalize">{q.level}</Badge>
                  </div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{q.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{q.question_count} questions</span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary">Start <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent></Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Challenges */}
      {chGrouped.map((g) => (
        <section key={g.kind} className="space-y-4">
          <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /><h2 className="text-lg font-semibold">{KIND_LABEL[g.kind]} Challenges</h2></div>
          <div className="grid gap-5 md:grid-cols-2">
            {g.items.map((c) => <ChallengeCard key={c.id} challenge={c} onDone={loadCh} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
