"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <p className="text-muted-foreground">Sharpen your instincts and keep your streak alive.</p>
      </div>

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
