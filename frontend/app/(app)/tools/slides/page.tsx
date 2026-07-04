"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles, Eye, LayoutGrid, Type, FileText, Palette, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolHeader } from "@/components/tool-header";

type Suggestion = { title: string; detail: string; impact: string };
type ImageMetrics = {
  width: number; height: number; aspect_ratio: string; orientation: string;
  megapixels: number; brightness: number; contrast: number; colorfulness: number;
  palette: string[];
};
type Resp = {
  provider: string; source?: string; image_metrics?: ImageMetrics | null;
  first_impression: string; layout: string; typography: string;
  clarity: string; consistency: string; suggestions: Suggestion[];
};

const IMPACT: Record<string, "default" | "warning" | "secondary"> = {
  high: "default", medium: "warning", low: "secondary",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default function SlidesPage() {
  const { refresh } = useAuth();
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | null>(null); // data URL
  const [imageName, setImageName] = useState<string>("");
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(file?: File) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > MAX_BYTES) { setError("Image is too large (max 8 MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setImageName(file.name); };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImage(null); setImageName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await api<Resp>("/ai/slides", {
        method: "POST",
        body: { notes, image_base64: image, image_name: imageName || undefined },
      });
      setData(res);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Analysis failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const canRun = (!!notes.trim() || !!image) && !busy;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ToolHeader
        icon={ImageIcon}
        title="Slide Analyzer"
        subtitle="Upload a slide or picture (or describe one) and get a first-impression test, layout critique, and ranked fixes."
        provider={data?.provider}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          {/* Image upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          {image ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={imageName || "slide"} className="max-h-80 w-full object-contain bg-secondary/30" />
              <button
                onClick={clearImage}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-3 py-1.5 text-xs text-white">{imageName}</div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/20 py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Upload className="h-7 w-7" />
              <span className="text-sm font-medium">Upload a slide or picture</span>
              <span className="text-xs">PNG, JPG, WebP · up to 8 MB</span>
            </button>
          )}

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: add context or paste the slide's text (headline, body, colors)…"
            className="min-h-[90px]"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {image ? "Image will be analyzed for size, contrast, brightness & palette." : "Tip: uploading an image gives objective, measured feedback."}
            </span>
            <Button variant="gradient" disabled={!canRun} onClick={run}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze slide
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {data.image_metrics && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 font-semibold">
                  <ImageIcon className="h-4 w-4 text-primary" /> Measured from your image
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="Dimensions" value={`${data.image_metrics.width}×${data.image_metrics.height}`} />
                  <Metric label="Aspect ratio" value={`${data.image_metrics.aspect_ratio} · ${data.image_metrics.orientation}`} />
                  <Metric label="Resolution" value={`${data.image_metrics.megapixels} MP`} />
                  <Metric label="Brightness" value={`${data.image_metrics.brightness}/100`} />
                </div>
                <div className="mt-4 space-y-3">
                  <Bar label="Brightness" value={data.image_metrics.brightness} />
                  <Bar label="Contrast" value={data.image_metrics.contrast} />
                  <Bar label="Colorfulness" value={data.image_metrics.colorfulness} />
                </div>
                {data.image_metrics.palette?.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dominant colors</div>
                    <div className="flex flex-wrap gap-2">
                      {data.image_metrics.palette.map((hex) => (
                        <div key={hex} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1">
                          <span className="h-5 w-5 rounded" style={{ backgroundColor: hex }} />
                          <span className="text-xs text-muted-foreground">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Criterion icon={Eye} title="First impression (3-second test)" text={data.first_impression} />
            <Criterion icon={LayoutGrid} title="Layout & composition" text={data.layout} />
            <Criterion icon={Type} title="Typography & hierarchy" text={data.typography} />
            <Criterion icon={FileText} title="Content clarity" text={data.clarity} />
            <Criterion icon={Palette} title="Brand & visual consistency" text={data.consistency} />
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 font-semibold">Top suggestions (ranked by impact)</div>
              <div className="space-y-3">
                {data.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 p-4">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.title}</span>
                        <Badge variant={IMPACT[s.impact] || "secondary"} className="capitalize">{s.impact} impact</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Criterion({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
