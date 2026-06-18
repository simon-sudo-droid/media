"use client";

import { useState } from "react";
import { Anchor, Loader2, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolHeader } from "@/components/tool-header";

type Score = { name: string; score: number };
type Resp = {
  provider: string; overall: number; scores: Score[];
  problem: string; suggestion: string; best_line?: string;
};

const SAMPLE = `In this video I'll share some thoughts about productivity.
Most creators waste years making this mistake.
Let me introduce myself first and tell you about my journey.`;

function ring(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export default function HookPage() {
  const { refresh } = useAuth();
  const [script, setScript] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await api<Resp>("/ai/hook", { method: "POST", body: { script } });
      setData(res);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ToolHeader
        icon={Anchor}
        title="Hook Analyser"
        subtitle="Paste your script and get a hook score with the one fix that matters most."
        provider={data?.provider}
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <Textarea value={script} onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script (the first lines matter most)…" className="min-h-[140px]" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setScript(SAMPLE)}>Use sample</Button>
            <Button variant="gradient" disabled={!script.trim() || busy} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze hook
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4 animate-in">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-7 text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hook Score</div>
              <div className={`text-5xl font-bold ${ring(data.overall)}`}>{data.overall}<span className="text-2xl text-muted-foreground">/100</span></div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.scores.map((s) => (
              <Card key={s.name}>
                <CardContent className="p-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className={ring(s.score)}>{s.score}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500" style={{ width: `${s.score}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-amber-500/30">
            <CardContent className="space-y-3 p-6">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-400" /> Problem</div>
                <p className="text-sm text-foreground/90">{data.problem}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-emerald-400" /> Suggestion</div>
                <p className="text-sm text-foreground/90">{data.suggestion}</p>
                {data.best_line && (
                  <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Move to the top →</span>
                    <p className="mt-1 font-medium">“{data.best_line}”</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
