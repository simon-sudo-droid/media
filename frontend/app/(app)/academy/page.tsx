"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, GraduationCap, Library, Search, Plus, ExternalLink, Loader2,
  Target, Eye, Dumbbell,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ── Tab 1: Marketing Mastery (editor weekly path) ─────────── */
const WEEKS = [
  { week: 1, title: "Foundations & the cut", practice: "Re-cut one clip 3 ways; cut strictly on action.", watch: "Breakdowns of clean dialogue scenes.", learn: "Hard cuts, J-cuts, L-cuts, cutaways." },
  { week: 2, title: "Pacing & rhythm", practice: "Cut a 30s montage to the beat of a track.", watch: "High-retention edits; note shot lengths.", learn: "Varying shot length; cut on motion." },
  { week: 3, title: "Hooks (first 3 seconds)", practice: "Make 5 different openings for the same video.", watch: "Top short-form hooks; why they stop the scroll.", learn: "Open loops, bold claims, curiosity gaps." },
  { week: 4, title: "B-roll & coverage", practice: "Cover a full talking head with only b-roll.", watch: "Conceptual (non-literal) b-roll examples.", learn: "Literal vs conceptual; shot variety." },
  { week: 5, title: "Storytelling structure", practice: "Build a 60s story with setup–tension–payoff.", watch: "Documentary + video-essay structure.", learn: "Three-act spine; finding the story in footage." },
  { week: 6, title: "Short-form vs long-form", practice: "Turn one interview into a Reel AND a long cut.", watch: "How creators repurpose across platforms.", learn: "Retention graphs; platform norms." },
  { week: 7, title: "Sound & color", practice: "Duck music under VO; apply a simple grade.", watch: "Sound-design + color breakdowns.", learn: "−16 LUFS loudness; LUTs & correction." },
  { week: 8, title: "Client work & delivery", practice: "Do a revision pass; export to spec + name files.", watch: "How editors handle feedback & briefs.", learn: "Deliverables, revisions, naming, export specs." },
];

/* ── Tab 2: Books & Courses ────────────────────────────────── */
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
const TAG_VARIANT: Record<string, "success" | "warning" | "default"> = {
  "Free": "success", "Paid": "warning", "Free+Paid": "default",
};

/* ── Tab 3: Glossary ───────────────────────────────────────── */
type Term = { id: number; term: string; definition: string; created_at: string };

const TABS = [
  { key: "mastery", label: "Marketing Mastery", icon: Target },
  { key: "library", label: "Books & Courses", icon: Library },
  { key: "glossary", label: "Glossary", icon: BookOpen },
];

export default function LearningHubPage() {
  const [tab, setTab] = useState("mastery");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="animate-in">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Learning Hub</h1>
        </div>
        <p className="text-muted-foreground">Get better every week — the path, the library, and the language of editing.</p>
      </div>

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
    </div>
  );
}

function Mastery() {
  return (
    <div className="space-y-4 stagger">
      <p className="text-sm text-muted-foreground">An 8-week loop for editors. Repeat it with harder projects each cycle — practice, study, and learn one focus per week.</p>
      {WEEKS.map((w) => (
        <Card key={w.week} className="lift">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">W{w.week}</span>
              <h3 className="font-semibold">{w.title}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MasteryCell icon={Dumbbell} label="Practice" text={w.practice} />
              <MasteryCell icon={Eye} label="Watch" text={w.watch} />
              <MasteryCell icon={GraduationCap} label="Learn" text={w.learn} />
            </div>
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{group.theme}</h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-4 stagger sm:grid-cols-2 lg:grid-cols-3">
              {group.books.map((b) => (
                <Card key={b.title} className="lift h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    <BookOpen className="mb-3 h-5 w-5 text-primary" />
                    <h3 className="font-semibold leading-snug">{b.title}</h3>
                    {b.author !== "—" && <p className="text-xs text-muted-foreground">{b.author}</p>}
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Courses & Platforms</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 stagger sm:grid-cols-2">
          {COURSES.map((c) => (
            <Card key={c.title} className="lift">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold leading-snug">{c.title}</h3>
                    <Badge variant={TAG_VARIANT[c.tag]}>{c.tag}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.by}</p>
                </div>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Visit</Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Glossary() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [busy, setBusy] = useState(false);

  function load() { api<Term[]>("/glossary").then(setTerms).catch(() => {}); }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return terms;
    return terms.filter((t) => t.term.toLowerCase().includes(n) || t.definition.toLowerCase().includes(n));
  }, [q, terms]);

  async function add() {
    if (!newTerm.trim() || !newDef.trim()) return;
    setBusy(true);
    try {
      await api("/glossary", { method: "POST", body: { term: newTerm, definition: newDef } });
      setNewTerm(""); setNewDef(""); setAdding(false);
      load();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms or definitions…"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <Button variant="gradient" onClick={() => setAdding((v) => !v)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Term</Button>
      </div>

      {adding && (
        <Card className="animate-in">
          <CardContent className="space-y-3 p-5">
            <input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Term (e.g. Speed ramp)"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            <textarea value={newDef} onChange={(e) => setNewDef(e.target.value)} placeholder="Definition…"
              className="min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button variant="gradient" size="sm" disabled={busy || !newTerm.trim() || !newDef.trim()} onClick={add}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save term
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="font-semibold text-primary">{t.term}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t.definition}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No terms match “{q}”.</p>}
    </div>
  );
}
