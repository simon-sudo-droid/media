"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Flame, Zap, CheckCircle2, XCircle, Loader2, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import { confettiBurst } from "@/lib/confetti";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Course = {
  id: number; slug: string; title: string; description: string;
  level: string; category: string; icon: string;
  lesson_count: number; completed_count: number;
};
const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "policy"];
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", policy: "Company Policy",
};

function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => { api<Course[]>("/courses").then(setCourses).catch(() => {}); }, []);
  const grouped = LEVEL_ORDER
    .map((lvl) => ({ level: lvl, items: courses.filter((c) => c.level === lvl) }))
    .filter((g) => g.items.length);

  if (!courses.length) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Courses</h2>
        <span className="text-sm text-muted-foreground">— structured tiers to work through</span>
      </div>
      {grouped.map((group) => (
        <section key={group.level} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{LEVEL_LABEL[group.level]}</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((c) => {
              const Icon = (Icons as any)[c.icon] || Icons.GraduationCap;
              const pct = c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
              return (
                <Link key={c.id} href={`/academy/${c.slug}`}>
                  <Card className="lift h-full">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                        <Badge variant="secondary">{LEVEL_LABEL[c.level]}</Badge>
                      </div>
                      <h4 className="font-semibold">{c.title}</h4>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                      <div className="mt-4 space-y-2">
                        <Progress value={pct} />
                        <div className="text-xs text-muted-foreground">{c.completed_count}/{c.lesson_count} lessons</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

type Challenge = {
  id: number; slug: string; title: string; description: string;
  level: string; kind: string; xp_reward: number; completed: boolean;
  payload: { question: string; options: string[]; correct_index: number; explanation: string };
};
type SubmitResult = { correct: boolean; correct_index: number; explanation: string; xp_earned: number };

const KIND_LABEL: Record<string, string> = {
  daily: "Daily Challenges", broll: "B-roll Challenges", editing: "Editing Challenges",
};
const KINDS = ["daily", "broll", "editing"];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  function load() {
    api<Challenge[]>("/challenges").then(setChallenges).catch(() => {});
  }
  useEffect(load, []);

  const grouped = KINDS.map((k) => ({ kind: k, items: challenges.filter((c) => c.kind === k) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
        <p className="text-muted-foreground">Work through the courses, then sharpen your instincts and keep your streak alive.</p>
      </div>

      <CoursesSection />

      {grouped.map((g) => (
        <section key={g.kind} className="space-y-4">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold">{KIND_LABEL[g.kind]}</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {g.items.map((c) => <ChallengeCard key={c.id} challenge={c} onDone={load} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChallengeCard({ challenge, onDone }: { challenge: Challenge; onDone: () => void }) {
  const { refresh } = useAuth();
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (choice === null) return;
    setBusy(true);
    try {
      const res = await api<SubmitResult>(`/challenges/${challenge.id}/submit`, { method: "POST", body: { answer: choice } });
      setResult(res);
      if (res.correct) confettiBurst();
      await refresh();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{challenge.title}</h3>
              {challenge.completed && <Badge variant="success">Done</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
          </div>
          <Badge variant="default" className="shrink-0 gap-1"><Zap className="h-3 w-3" /> +{challenge.xp_reward}</Badge>
        </div>

        <p className="text-sm font-medium">{challenge.payload.question}</p>

        <div className="space-y-2">
          {challenge.payload.options.map((opt, oi) => {
            const selected = choice === oi;
            let cls = "border-border hover:bg-secondary/60";
            if (result) {
              if (oi === result.correct_index) cls = "border-emerald-500/60 bg-emerald-500/10";
              else if (selected) cls = "border-red-500/60 bg-red-500/10";
              else cls = "border-border opacity-60";
            } else if (selected) cls = "border-primary bg-primary/10";
            return (
              <button
                key={oi}
                disabled={!!result}
                onClick={() => setChoice(oi)}
                className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${cls}`}
              >
                <span>{opt}</span>
                {result && oi === result.correct_index && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {result && selected && oi !== result.correct_index && <XCircle className="h-4 w-4 text-red-400" />}
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-2">
            <Badge variant={result.correct ? "success" : "warning"}>
              {result.correct ? `Correct! +${result.xp_earned} XP` : "Not quite"}
            </Badge>
            <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why: </span>{result.explanation}
            </p>
          </div>
        ) : (
          <Button variant="gradient" className="mt-auto" disabled={choice === null || busy} onClick={submit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
