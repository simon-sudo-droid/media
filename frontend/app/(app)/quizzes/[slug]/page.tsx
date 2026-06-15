"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Zap, Loader2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { confettiBurst } from "@/lib/confetti";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Question = { id: number; prompt: string; options: string[] };
type Quiz = { id: number; slug: string; title: string; description: string; questions: Question[] };
type Correction = { question_id: number; correct_index: number; explanation: string; was_correct: boolean };
type Result = { score: number; total: number; xp_earned: number; corrections: Correction[] };

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const { refresh } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Quiz>(`/quizzes/${slug}`).then(setQuiz).catch(() => {});
  }, [slug]);

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    try {
      const res = await api<Result>(`/quizzes/${slug}/submit`, { method: "POST", body: { answers } });
      setResult(res);
      if (res.total > 0 && res.score / res.total >= 0.6) confettiBurst();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAnswers({});
    setResult(null);
  }

  if (!quiz) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const corrById = (id: number) => result?.corrections.find((c) => c.question_id === id);
  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
        <p className="text-muted-foreground">{quiz.description}</p>
      </div>

      {result && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-col items-center gap-3 p-7 text-center">
            <div className="text-4xl font-bold text-gradient">{result.score}/{result.total}</div>
            <Badge variant="success" className="gap-1"><Zap className="h-3 w-3" /> +{result.xp_earned} XP earned</Badge>
            <Button variant="outline" size="sm" onClick={reset} className="mt-2"><RotateCcw className="h-4 w-4" /> Try again</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {quiz.questions.map((q, qi) => {
          const corr = corrById(q.id);
          return (
            <Card key={q.id}>
              <CardContent className="space-y-3 p-6">
                <div className="font-medium">{qi + 1}. {q.prompt}</div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q.id] === oi;
                    let cls = "border-border hover:bg-secondary/60";
                    if (result && corr) {
                      if (oi === corr.correct_index) cls = "border-emerald-500/60 bg-emerald-500/10";
                      else if (selected) cls = "border-red-500/60 bg-red-500/10";
                      else cls = "border-border opacity-60";
                    } else if (selected) {
                      cls = "border-primary bg-primary/10";
                    }
                    return (
                      <button
                        key={oi}
                        disabled={!!result}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${cls}`}
                      >
                        <span>{opt}</span>
                        {result && corr && oi === corr.correct_index && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        {result && corr && selected && oi !== corr.correct_index && <XCircle className="h-4 w-4 text-red-400" />}
                      </button>
                    );
                  })}
                </div>
                {result && corr && (
                  <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Why: </span>{corr.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!result && (
        <Button variant="gradient" className="w-full" disabled={!allAnswered || busy} onClick={submit}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {allAnswered ? "Submit answers" : "Answer all questions to submit"}
        </Button>
      )}
    </div>
  );
}
