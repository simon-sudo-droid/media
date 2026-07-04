"use client";

import { useRef, useState } from "react";
import { Award, Loader2, Sparkles, AlertTriangle, CheckCircle2, FileCode, Film, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolHeader } from "@/components/tool-header";

type Score = { name: string; score: number };
type Resp = {
  provider: string; source: string; overall: number;
  scores: Score[]; issues: string[]; recommendations: string[];
};

const MAX_VIDEO = 500 * 1024 * 1024;   // allow up to 500 MB uploads
const INLINE_AI_LIMIT = 20 * 1024 * 1024; // only files ≤20MB are sent inline for AI vision (Gemini inline cap)

function tone(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export default function SeniorEditorPage() {
  const { refresh } = useAuth();
  const [script, setScript] = useState("");
  const [transcript, setTranscript] = useState("");
  const [xml, setXml] = useState("");
  const [xmlName, setXmlName] = useState("");
  const [video, setVideo] = useState<string | null>(null);
  const [videoName, setVideoName] = useState("");
  const [largeVideo, setLargeVideo] = useState(false);
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const xmlRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  function onXml(file?: File) {
    if (!file) return;
    setXmlName(file.name);
    const r = new FileReader();
    r.onload = () => setXml(r.result as string);
    r.readAsText(file);
  }
  function onVideo(file?: File) {
    setError("");
    if (!file) return;
    if (file.size > MAX_VIDEO) { setError("Video too large (max 500 MB)."); return; }
    setVideoName(file.name);
    if (file.size <= INLINE_AI_LIMIT) {
      setLargeVideo(false);
      const r = new FileReader();
      r.onload = () => setVideo(r.result as string);
      r.readAsDataURL(file);
    } else {
      // Too big to send inline for AI vision — analyze via metadata + script/transcript/XML.
      setVideo(null);
      setLargeVideo(true);
    }
  }

  async function run() {
    setBusy(true); setError("");
    try {
      const res = await api<Resp>("/ai/senior-review", {
        method: "POST",
        body: { script, transcript, premiere_xml: xml, video_base64: video, video_name: videoName || undefined },
      });
      setData(res);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  const canRun = (!!script.trim() || !!transcript.trim() || !!xml.trim() || !!video) && !busy;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ToolHeader
        icon={Award}
        title="Senior Editor"
        subtitle="Upload your script, transcript, Premiere XML and finished video — get a senior-editor scorecard with issues and fixes."
        provider={data?.provider}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Script (optional)…" className="min-h-[110px]" />
            <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transcript (optional)…" className="min-h-[110px]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input ref={xmlRef} type="file" accept=".xml,.fcpxml,text/xml" className="hidden" onChange={(e) => onXml(e.target.files?.[0])} />
            <button onClick={() => xmlRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-3 text-sm text-muted-foreground hover:border-primary/50">
              <FileCode className="h-4 w-4" /> {xmlName || "Upload Premiere XML"}
            </button>
            <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={(e) => onVideo(e.target.files?.[0])} />
            <button onClick={() => vidRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-3 text-sm text-muted-foreground hover:border-primary/50">
              <Film className="h-4 w-4" /> {videoName || "Upload finished video (up to 500 MB)"}
              {(video || largeVideo) && <X className="ml-auto h-4 w-4" onClick={(e) => { e.stopPropagation(); setVideo(null); setVideoName(""); setLargeVideo(false); }} />}
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {largeVideo && (
            <p className="text-xs text-amber-400">
              Large file ({videoName}) accepted — for files over 20 MB the AI can&rsquo;t watch it inline, so it&rsquo;s
              scored from your script/transcript/Premiere XML. (Full large-video AI analysis needs the Gemini Files API.)
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Premiere XML gives real pacing/variety analysis. Videos ≤20 MB are watched by AI when a vision key is active.</span>
            <Button variant="gradient" disabled={!canRun} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4 animate-in">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-7 text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall Score</div>
              <div className={`text-5xl font-bold ${tone(data.overall)}`}>{data.overall}%</div>
              <Badge variant="secondary">{data.source === "gemini" ? "AI video analysis" : "Heuristic estimate"}</Badge>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.scores.map((s) => (
              <Card key={s.name}>
                <CardContent className="p-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className={tone(s.score)}>{s.score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${s.score}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-amber-500/30">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-400" /> Issues</div>
                <ul className="space-y-2">
                  {data.issues.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm text-foreground/90"><span className="text-amber-400">•</span> {it}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/30">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Recommendations</div>
                <ul className="space-y-2">
                  {data.recommendations.map((r, i) => <li key={i} className="flex items-start gap-2 text-sm text-foreground/90"><span className="text-emerald-400">•</span> {r}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
