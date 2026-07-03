"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy, BookOpen, Sparkles, HelpCircle, MessageCirclePlus, Loader2,
  Send, CheckCircle2, ArrowUpCircle, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Faq = { id: number; question: string; answer: string };
type Change = { id: number; entry_date: string; title: string; body: string; tag: string };
type Question = { id: number; user_id: number; asker_name: string; question: string; answer: string; answered: boolean; promoted: boolean; created_at: string };

const HOW_TO = [
  { title: "Learning Hub", steps: ["Open the Marketing Mastery tab for the weekly editor path.", "Browse Books & Courses for curated resources.", "Use the Glossary to look up editing terms — or add your own with “+ Add Term”."] },
  { title: "Challenges & Courses", steps: ["Work through the tiered Courses (Beginner → Advanced) at the top.", "Take Daily, B-roll, and Editing challenges to earn XP and keep your streak."] },
  { title: "Tracker Analytics", steps: ["Click “New entry”, fill the date, output link, episode, clip name, leadership month/day, and case study.", "Save — it's stored under your name and locks (only an admin can edit it after).", "Filter by editor, month, or date range; watch the charts update live."] },
  { title: "AI Tools", steps: ["Script → B-roll: paste a script for timecoded b-roll + multi-source queries.", "Hook Analyser, Senior Editor, Storytelling & Slide tools give scored feedback."] },
  { title: "Guide & Help", steps: ["Read the How-to and FAQ first.", "Still stuck? Use “Ask a question” below — an admin will answer, and great answers become FAQs."] },
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
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_TO.map((h) => (
            <Card key={h.title}><CardContent className="p-5">
              <h3 className="mb-2 font-semibold">{h.title}</h3>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                {h.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-semibold text-primary">{i + 1}.</span> {s}</li>)}
              </ol>
            </CardContent></Card>
          ))}
        </div>
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
