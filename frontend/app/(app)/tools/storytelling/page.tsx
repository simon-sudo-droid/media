"use client";

import { useState } from "react";
import { BookOpenCheck, Loader2, Sparkles, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ToolHeader } from "@/components/tool-header";

type Score = { name: string; score: number; note: string };
type Resp = { provider: string; overall: number; scores: Score[]; suggestions: string[] };

export default function StorytellingPage() {
  const { refresh } = useAuth();
  const [script, setScript] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await api<Resp>("/ai/storytelling", { method: "POST", body: { script } });
      setData(res);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const ring = (n: number) => (n >= 75 ? "text-emerald-400" : n >= 50 ? "text-amber-400" : "text-red-400");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ToolHeader
        icon={BookOpenCheck}
        title="Storytelling Coach"
        subtitle="Get your script scored on hook, pacing, emotion, curiosity and call-to-action — with fixes."
        provider={data?.provider}
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste your script or narration…" className="min-h-[160px]" />
          <div className="flex justify-end">
            <Button variant="gradient" disabled={!script.trim() || busy} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze storytelling
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card className="border-primary/30">
            <CardContent className="flex flex-col items-center gap-2 p-7 text-center">
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Overall storytelling</div>
              <div className={`text-5xl font-bold ${ring(data.overall)}`}>{data.overall}</div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              {data.scores.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className={`font-semibold ${ring(s.score)}`}>{s.score}</span>
                  </div>
                  <Progress value={s.score} />
                  <p className="text-xs text-muted-foreground">{s.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-amber-400" /> Suggestions</div>
              <ul className="space-y-2 text-sm text-foreground/90">
                {data.suggestions.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">→</span> {s}</li>)}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
