"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy, BookOpen, Sparkles, HelpCircle, MessageCirclePlus, Loader2,
  Send, CheckCircle2, ArrowUpCircle, ChevronDown, ArrowRight, ArrowLeft,
  GraduationCap, Wand2, BarChart3, Palette, Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Faq = { id: number; question: string; answer: string };
type Change = { id: number; entry_date: string; title: string; body: string; tag: string };
type Question = { id: number; user_id: number; asker_name: string; question: string; answer: string; answered: boolean; promoted: boolean; created_at: string };

type HowTo = { key: string; icon: any; title: string; summary: string; intro: string; steps: string[]; tips: string[]; adminOnly?: boolean };
const HOW_TO: HowTo[] = [
  {
    key: "hub", icon: GraduationCap, title: "Learning Hub",
    summary: "The weekly path, the library, the dictionary, and practice.",
    intro: "The Learning Hub is where you grow as an editor. It has four tabs, each serving a different part of getting better.",
    steps: [
      "Marketing Mastery — an 8-week editor path. Click any week to open a detailed lesson with an overview, what to practice/watch/learn, and 5 real-world scenarios.",
      "Books & Courses — a curated library grouped by theme; each book and course has a “Visit” button that opens it on the web.",
      "Glossary — a searchable editing dictionary (video, audio, podcast, thumbnail). Search for meaning + examples, browse the related-searches chips, or add your own term with “+ Add Term”.",
      "Quizzes & Challenges — the tiered Courses plus quizzes and interactive challenges to test yourself and earn XP.",
    ],
    tips: ["Repeat the 8-week Mastery loop with harder projects each cycle.", "Add glossary terms your team uses so everyone shares the same language."],
  },
  {
    key: "tools", icon: Wand2, title: "AI Tools",
    summary: "All five tools in one hub.",
    intro: "Open “AI Tools” in the sidebar to reach every tool in one place. Each gives instant, editor-focused feedback.",
    steps: [
      "Script → B-roll — paste a script to get timecoded b-roll placements plus Storyblocks/Pexels/Midjourney search & generation prompts.",
      "Hook Analyser — score your opening on curiosity, clarity, emotion & length, with the one fix that matters most.",
      "Senior Editor — upload script, transcript, Premiere XML and the finished video for a full scorecard with issues and fixes.",
      "Storytelling Coach & Slide Analyzer — score narrative structure, and critique a slide/thumbnail you upload.",
    ],
    tips: ["The tools run in high-quality mock mode and automatically upgrade to live AI when an API key with quota is configured."],
  },
  {
    key: "tracker", icon: BarChart3, title: "Tracker Analytics",
    summary: "Log daily output; see live team charts.",
    intro: "Tracker Analytics is your team's daily work log. Every entry is attributed to you and feeds the live charts.",
    steps: [
      "Click “New entry” and fill the date, output link, episode, clip name, leadership month/day, and case-study reel, then Save.",
      "Once saved, an entry locks — only an admin can edit or delete it, keeping the record accurate.",
      "Filter by editor, month, or date range; the summary strip and charts update to match.",
      "The Data Analytics charts show clips-by-editor and clips-over-time (toggle month/day) and refresh live as entries are added.",
    ],
    tips: ["“Clips submitted” counts each entry that has a clip name.", "Admins: use Edit/Delete on any entry to correct or clean up records."],
  },
  {
    key: "guide", icon: LifeBuoy, title: "Guide & Help",
    summary: "Self-serve answers before you ask.",
    intro: "This page helps you find answers fast — and get new ones when you can't.",
    steps: [
      "Read the How-to (this section) and the FAQ first.",
      "Check “What's new” for recent updates.",
      "Still stuck? Use “Ask a question” — it's saved for an admin to answer.",
      "Admins answer questions and can promote the best answers straight into the FAQ.",
    ],
    tips: ["Search the FAQ by scanning the questions — click one to expand its answer."],
  },
  {
    key: "appearance", icon: Palette, title: "Appearance & account",
    summary: "Theme and account controls.",
    intro: "Personalize the app and manage your account from the sidebar and top-right menu.",
    steps: [
      "Use the Light / Dark / System switcher at the bottom of the sidebar. “System” follows your device.",
      "Open the avatar menu (top-right) for Profile, Settings, Help, Switch account, and Log out.",
      "The bell icon shows “What's new” notifications.",
      "Forgot your password? Use “Forgot password?” on the login page to reset by email.",
    ],
    tips: ["Your appearance choice is remembered on this device."],
  },
  {
    key: "admin", icon: Shield, title: "Admin", adminOnly: true,
    summary: "Oversight, trends, and content control.",
    intro: "Admin-only tools for running the team (visible only to the administrator account).",
    steps: [
      "Admin → Users: see who signed in, their activity and output.",
      "Admin → Activity: a live feed of what everyone did.",
      "Admin → Creative Intelligence: a daily digest of AI/editing trends from free sources.",
      "Edit or delete any Tracker entry; answer Help questions and promote them to FAQ; the Leaderboard is admin-only.",
    ],
    tips: ["Set SMTP env vars to send real password-reset emails; add a Gemini key to power live AI + the trends digest."],
  },
];

const CHANGE_TAG: Record<string, "default" | "success" | "secondary" | "warning"> = {
  Feature: "success", Content: "secondary", Fix: "warning", Update: "default",
};

export default function GuidePage() {
  const { user } = useAuth();
  const [faq, setFaq] = useState<Faq[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [howKey, setHowKey] = useState<string | null>(null);
  const howGuides = HOW_TO.filter((h) => !h.adminOnly || user?.is_admin);
  const how = howGuides.find((h) => h.key === howKey);

  function loadQuestions() { api<Question[]>("/help/questions").then(setQuestions).catch(() => {}); }
  useEffect(() => {
    api<Faq[]>("/help/faq").then(setFaq).catch(() => {});
    api<Change[]>("/help/changelog").then(setChanges).catch(() => {});
    loadQuestions();
  }, []);

  async function ask() {
    if (q.trim().length < 3) return;
    setBusy(true);
    try { await api("/help/questions", { method: "POST", body: { question: q } }); setQ(""); loadQuestions(); }
    finally { setBusy(false); }
  }
  async function answer(id: number) {
    const a = (answers[id] || "").trim();
    if (!a) return;
    await api(`/help/questions/${id}/answer`, { method: "PATCH", body: { answer: a } });
    setAnswers({ ...answers, [id]: "" }); loadQuestions();
  }
  async function promote(id: number) {
    await api(`/help/questions/${id}/promote`, { method: "POST" });
    api<Faq[]>("/help/faq").then(setFaq).catch(() => {}); loadQuestions();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="animate-in">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Guide & Help</h1>
        </div>
        <p className="text-muted-foreground">Find answers fast — how-to, what's new, FAQ, and ask a question.</p>
      </div>

      {/* How-to */}
      <section className="space-y-4">
        <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">How to use EditMentor</h2></div>
        {how ? (
          <div className="space-y-4 animate-in">
            <button onClick={() => setHowKey(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to all guides
            </button>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><how.icon className="h-5 w-5" /></div>
                  <h3 className="text-xl font-bold tracking-tight">{how.title}</h3>
                </div>
                <p className="mt-4 leading-relaxed text-foreground/90">{how.intro}</p>
                <div className="mt-5 space-y-2">
                  {how.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 p-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{i + 1}</span>
                      <p className="text-sm text-foreground/90">{s}</p>
                    </div>
                  ))}
                </div>
                {how.tips.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Tips</div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {how.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span> {t}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 stagger sm:grid-cols-2">
            {howGuides.map((h) => (
              <button key={h.key} onClick={() => setHowKey(h.key)} className="block text-left">
                <Card className="lift h-full"><CardContent className="flex h-full items-center gap-3 p-5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><h.icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{h.title}</h3>
                    <p className="truncate text-sm text-muted-foreground">{h.summary}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </CardContent></Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* What's new */}
      <section className="space-y-4">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">What's new</h2></div>
        <Card><CardContent className="divide-y divide-border p-0">
          {changes.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-4">
              <Badge variant={CHANGE_TAG[c.tag] || "default"} className="mt-0.5 shrink-0">{c.tag}</Badge>
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{c.title}</span><span className="text-xs text-muted-foreground">{c.entry_date}</span></div>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
          {changes.length === 0 && <p className="p-4 text-sm text-muted-foreground">No updates yet.</p>}
        </CardContent></Card>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">FAQ</h2></div>
        <div className="space-y-2">
          {faq.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span className="font-medium">{f.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === f.id ? "rotate-180" : ""}`} />
              </button>
              {openFaq === f.id && <CardContent className="border-t border-border p-4 pt-3 text-sm text-muted-foreground">{f.answer}</CardContent>}
            </Card>
          ))}
        </div>
      </section>

      {/* Ask a question */}
      <section className="space-y-4">
        <div className="flex items-center gap-2"><MessageCirclePlus className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Ask a question</h2></div>
        <Card><CardContent className="space-y-3 p-5">
          <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you need help with?"
            className="min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex justify-end">
            <Button variant="gradient" size="sm" disabled={busy || q.trim().length < 3} onClick={ask}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send question</Button>
          </div>
        </CardContent></Card>

        {questions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{user?.is_admin ? "All questions" : "Your questions"}</h3>
            {questions.map((qq) => (
              <Card key={qq.id}><CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{qq.question}</p>
                  <div className="flex shrink-0 gap-1">
                    {qq.answered && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Answered</Badge>}
                    {qq.promoted && <Badge variant="secondary">In FAQ</Badge>}
                  </div>
                </div>
                {user?.is_admin && <p className="text-xs text-muted-foreground">Asked by {qq.asker_name}</p>}
                {qq.answer && <p className="rounded-lg bg-secondary/40 p-3 text-sm"><span className="font-medium text-foreground">Answer: </span>{qq.answer}</p>}

                {user?.is_admin && (
                  <div className="space-y-2 border-t border-border pt-2">
                    <textarea value={answers[qq.id] ?? qq.answer ?? ""} onChange={(e) => setAnswers({ ...answers, [qq.id]: e.target.value })}
                      placeholder="Write an answer…" className="min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => answer(qq.id)}>Save answer</Button>
                      {qq.answered && !qq.promoted && <Button variant="gradient" size="sm" className="gap-1" onClick={() => promote(qq.id)}><ArrowUpCircle className="h-3.5 w-3.5" /> Promote to FAQ</Button>}
                    </div>
                  </div>
                )}
              </CardContent></Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
