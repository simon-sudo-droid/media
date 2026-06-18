"use client";

import { useEffect, useRef, useState } from "react";
import {
  ScanSearch, Loader2, Clapperboard, Film, Sparkles,
  Lightbulb, Shuffle, Copy, Check, Download, Wand2, Info, Video, ExternalLink,
  Clock, MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolHeader } from "@/components/tool-header";

type GenPrompt = {
  label: string; shot_type: string; approach: string;
  prompt: string; resolution: string; duration: string;
};
type Sources = { storyblocks?: string[]; pexels?: string[]; image_prompts?: string[] };
type Scene = {
  scene: string; timecode?: string; need?: string;
  broll_ideas?: string[]; concept_ideas?: string[];
  sources?: Sources; gen_prompts?: GenPrompt[];
};

const slug = (q: string) => q.trim().toLowerCase().replace(/\s+/g, "-");
const storyblocksUrl = (q: string) => `https://www.storyblocks.com/video/search/${encodeURIComponent(slug(q))}`;
const pexelsUrl = (q: string) => `https://www.pexels.com/search/videos/${encodeURIComponent(slug(q))}/`;
type Resp = { provider: string; scenes: Scene[] };

const SAMPLE = `Most people think editing is about cutting clips together. It's not.
Editing is decision-making. Every cut answers a question.
Today, I'll show you the three cuts that make any video feel professional — and how to use them.`;

const SHOT_TAXONOMY = [
  { group: "Building blocks", items: [
    ["Establishing shots", "Wide frames at the start of a sequence to show where the action happens."],
    ["Cutaways", "Brief clips that interrupt the main footage to show a related object/action (e.g. a ringing phone)."],
    ["Inserts & close-ups", "Tight shots isolating a specific element or gesture to highlight detail."],
    ["Reaction shots", "Genuine, unscripted responses and expressions from participants."],
  ]},
  { group: "Storyteller", items: [
    ["Atmospheric / ambient", "Observational footage that captures mood, setting and environment."],
    ["Supporting shots", "Literal footage describing exactly what's being said (showing the pan while describing the recipe)."],
    ["Practical inserts", "Visual aids — text, diagrams, printouts — for a personal touch."],
    ["Narrative b-roll", "Artistic shots that tell their own story or work as visual metaphors — a 'subplot'."],
    ["Stock footage", "Ready-made clips from royalty-free or paid platforms."],
    ["Archival footage", "Historical imagery used for context or to support a story about the past."],
  ]},
];

export default function BrollPage() {
  const { refresh } = useAuth();
  const [script, setScript] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  function downloadBrief() {
    if (!data) return;
    const lines: string[] = ["EditMentor AI — B-roll Generation Brief", "=".repeat(44), ""];
    data.scenes.forEach((s, i) => {
      lines.push(`SCENE ${i + 1}: ${s.scene}`);
      (s.gen_prompts || []).forEach((g) => {
        lines.push(`  • [${g.label}] (${g.resolution}, ${g.duration})`);
        lines.push(`    ${g.prompt}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "broll-generation-brief.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ToolHeader
        icon={ScanSearch}
        title="Script → B-roll Generator"
        subtitle="Paste a script and get scene-by-scene b-roll, shot variety, conceptual visuals, and ready-to-render generation briefs."
        provider={data?.provider}
      />

      {/* How we choose b-roll — collapsible guidance */}
      <Card>
        <CardContent className="p-0">
          <button onClick={() => setShowGuide((v) => !v)} className="flex w-full items-center justify-between p-5 text-left">
            <span className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-primary" /> How we choose great b-roll</span>
            <Badge variant="secondary">{showGuide ? "Hide" : "Show"}</Badge>
          </button>
          {showGuide && (
            <div className="space-y-5 border-t border-border p-5 animate-in">
              <Guide icon={Shuffle} title="1 · Variety">
                Even with AI or stock footage, don&rsquo;t let everything feel repetitive. Intentionally mix
                <strong> wide, medium, and close-up</strong> shots to keep videos dynamic and engaging.
              </Guide>
              <Guide icon={Lightbulb} title="2 · Think conceptually, not just literally">
                Not everything needs to be literal. For abstract lines, use <strong>conceptual visuals</strong> that
                represent the idea or feeling.
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• “Stay focused to succeed” → blocking distractions, a clean-vs-messy desk, a blurred background.</li>
                  <li>• “Growth takes time” → a plant growing, a timelapse, calendar pages flipping.</li>
                </ul>
                <span className="mt-2 block text-sm">Think literally → limited. Think conceptually → more creative, less repetitive, more engaging.</span>
              </Guide>
              <div>
                <div className="mb-2 flex items-center gap-2 font-medium"><Film className="h-4 w-4 text-primary" /> 3 · Types of b-roll</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {SHOT_TAXONOMY.map((g) => (
                    <div key={g.group} className="rounded-lg bg-secondary/40 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.group}</div>
                      <dl className="space-y-2">
                        {g.items.map(([t, d]) => (
                          <div key={t}>
                            <dt className="text-sm font-medium">{t}</dt>
                            <dd className="text-sm text-muted-foreground">{d}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
        <div className="space-y-4 stagger">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={downloadBrief}><Download className="h-4 w-4" /> Download generation brief (.txt)</Button>
          </div>
          {data.scenes.map((s, i) => (
            <Card key={i} className="lift">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" className="shrink-0">Scene {i + 1}</Badge>
                  {s.timecode && (
                    <Badge variant="secondary" className="gap-1 font-mono"><Clock className="h-3 w-3" /> {s.timecode}</Badge>
                  )}
                </div>
                <p className="text-sm italic text-muted-foreground">“{s.scene}”</p>

                {s.need && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-sm font-medium">{s.need}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <SuggestList icon={Film} title="B-roll ideas" items={s.broll_ideas || []} />
                  <SuggestList icon={Lightbulb} title="Conceptual (non-literal) ideas" items={s.concept_ideas || []} />
                </div>

                {/* Multi-source generation */}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <Video className="h-4 w-4 text-emerald-400" /> Generate real b-roll
                    <Badge variant="success" className="gap-1">4K / 1080p</Badge>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Multiple sources — click a chip to open the search, then generate/download. Storyblocks &amp; Pexels open pre-searched; image prompts are for Midjourney/DALL·E.
                  </p>

                  {(s.sources?.storyblocks?.length ?? 0) > 0 && (
                    <SourceRow label="Storyblocks" color="emerald" queries={s.sources!.storyblocks!} hrefFn={storyblocksUrl} />
                  )}
                  {(s.sources?.pexels?.length ?? 0) > 0 && (
                    <SourceRow label="Pexels" color="sky" queries={s.sources!.pexels!} hrefFn={pexelsUrl} />
                  )}
                  {(s.sources?.image_prompts?.length ?? 0) > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 text-xs font-semibold text-fuchsia-300">Midjourney / image prompts</div>
                      <div className="space-y-2">
                        {s.sources!.image_prompts!.map((p, pi) => <CopyPrompt key={pi} text={p} />)}
                      </div>
                    </div>
                  )}
                </div>

                {(s.gen_prompts?.length ?? 0) > 0 && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Wand2 className="h-4 w-4 text-primary" /> AI-video generation briefs
                      <span className="text-xs font-normal text-muted-foreground">— for Runway, Luma, Veo, Pika…</span>
                    </div>
                    <div className="space-y-3">
                      {s.gen_prompts!.map((g, gi) => <GenPromptCard key={gi} g={g} />)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type VideoJob = {
  job_id: string;
  status: "pending" | "done" | "error";
  provider: string;
  kind: string;        // video | storyboard
  data_url: string;
  error?: string;
};

const POLL_MS = 5000;
const MAX_POLLS = 72; // ~6 minutes

function GenPromptCard({ g }: { g: GenPrompt }) {
  const [copied, setCopied] = useState(false);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(g.prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  function schedulePoll(jobId: string, n: number) {
    if (n > MAX_POLLS) { setErr("Timed out waiting for the clip. Try again."); setBusy(false); return; }
    timer.current = setTimeout(async () => {
      if (!alive.current) return;
      try {
        const res = await api<VideoJob>(`/ai/broll/video/${jobId}`);
        if (!alive.current) return;
        if (res.status === "pending") { schedulePoll(jobId, n + 1); return; }
        if (res.status === "error") { setErr(res.error || "Generation failed."); setBusy(false); return; }
        setJob(res); setBusy(false);
      } catch {
        schedulePoll(jobId, n + 1); // transient — keep polling
      }
    }, POLL_MS);
  }

  async function genVideo() {
    setBusy(true); setErr(""); setJob(null);
    try {
      const res = await api<VideoJob>("/ai/broll/video", { method: "POST", body: { prompt: g.prompt, label: g.label } });
      if (res.status === "done") { setJob(res); setBusy(false); return; }   // instant storyboard fallback
      if (res.status === "error") { setErr(res.error || "Couldn’t start generation."); setBusy(false); return; }
      schedulePoll(res.job_id, 0);
    } catch { setErr("Couldn’t start generation — try again."); setBusy(false); }
  }

  const isVideo = job?.kind === "video";
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{g.label}</span>
        <Badge variant={g.approach === "conceptual" ? "default" : "secondary"} className="capitalize">{g.approach}</Badge>
        <Badge variant="secondary" className="capitalize">{g.shot_type}</Badge>
        <Badge variant="outline">{g.resolution}</Badge>
        <Badge variant="outline">{g.duration}</Badge>
        <button onClick={copy} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy prompt</>}
        </button>
      </div>
      <p className="text-sm text-foreground/90">{g.prompt}</p>

      <div className="mt-3 space-y-2">
        {!job && (
          <Button variant="outline" size="sm" disabled={busy} onClick={genVideo}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
            {busy ? "Rendering clip… (~1–2 min)" : "Generate sample clip (Veo)"}
          </Button>
        )}
        {busy && !job && <p className="text-xs text-muted-foreground">Veo is rendering your clip — this usually takes a minute or two. You can keep editing meanwhile.</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
        {job && (
          <figure className="overflow-hidden rounded-lg border border-border">
            {isVideo ? (
              <video src={job.data_url} className="w-full" controls loop autoPlay muted playsInline />
            ) : (
              <img src={job.data_url} alt={`Sample b-roll for ${g.label}`} className="w-full" />
            )}
            <figcaption className="flex flex-wrap items-center justify-between gap-2 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-primary" />
                {isVideo ? `Veo sample clip · ${job.provider}` : "Veo unavailable — storyboard preview"}
              </span>
              <span className="flex items-center gap-3">
                <button onClick={genVideo} disabled={busy} className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shuffle className="h-3.5 w-3.5" />} Regenerate
                </button>
                <a href={job.data_url} download={`sample-${g.shot_type || "broll"}.${isVideo ? "mp4" : "svg"}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}

function Guide({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary" /> {title}</div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function SuggestList({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg bg-secondary/40 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</div>
      <ul className="space-y-1.5 text-sm text-foreground/90">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span> {it}</li>)}
      </ul>
    </div>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
};

function SourceRow({ label, color, queries, hrefFn }: { label: string; color: string; queries: string[]; hrefFn: (q: string) => string }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {queries.map((q, i) => (
          <a key={i} href={hrefFn(q)} target="_blank" rel="noopener noreferrer"
             className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${SOURCE_COLORS[color] || SOURCE_COLORS.emerald}`}>
            {q} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }
  return (
    <div className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5">
      <p className="flex-1 text-xs text-foreground/90">{text}</p>
      <button onClick={copy} className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
        {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
      </button>
    </div>
  );
}
