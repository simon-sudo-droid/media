"use client";

import { useState } from "react";
import { ScanSearch, Loader2, Camera, Clapperboard, Type, Film, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolHeader } from "@/components/tool-header";

type Scene = {
  scene: string; broll_ideas: string[]; camera_angles: string[];
  motion_graphics: string[]; text_overlays: string[];
};
type Resp = { provider: string; scenes: Scene[] };

const SAMPLE = `Most people think editing is about cutting clips together. It's not.
Editing is decision-making. Every cut answers a question.
Today, I'll show you the three cuts that make any video feel professional — and how to use them.`;

export default function BrollPage() {
  const { refresh } = useAuth();
  const [script, setScript] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await api<Resp>("/ai/broll", { method: "POST", body: { script } });
      setData(res);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ToolHeader
        icon={ScanSearch}
        title="Script → B-roll Generator"
        subtitle="Paste a script and get scene-by-scene b-roll, camera angles, motion graphics & text overlay ideas."
        provider={data?.provider}
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your video script here…"
            className="min-h-[160px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setScript(SAMPLE)}>Use sample script</Button>
            <Button variant="gradient" disabled={!script.trim() || busy} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4">
          {data.scenes.map((s, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <Badge variant="default" className="shrink-0">Scene {i + 1}</Badge>
                  <p className="text-sm italic text-muted-foreground">“{s.scene}”</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SuggestList icon={Film} title="B-roll ideas" items={s.broll_ideas} />
                  <SuggestList icon={Camera} title="Camera angles" items={s.camera_angles} />
                  <SuggestList icon={Clapperboard} title="Motion graphics" items={s.motion_graphics} />
                  <SuggestList icon={Type} title="Text overlays" items={s.text_overlays} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestList({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</div>
      <ul className="space-y-1.5 text-sm text-foreground/90">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span> {it}</li>)}
      </ul>
    </div>
  );
}
