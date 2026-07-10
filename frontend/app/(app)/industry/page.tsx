"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Radar, Newspaper, Clapperboard, Rocket, Video, Zap, TestTube2, TrendingUp,
  CheckCircle2, Link2, ExternalLink, RefreshCw, Loader2, CalendarDays,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";

/* ── Types (mirror the backend digest payload) ─────────────── */
type Item = { title: string; summary: string; source: string; url: string; date: string; tool?: string; why?: string; who?: string; worth_testing?: string };
type Rec = { title: string; verdict: string; detail: string; impact: string; url: string };
type Tool = { tool: string; description: string; use_case: string; advantages: string; limitations: string; priority: string; url: string };
type Src = { group: string; name: string; url: string };
type Digest = {
  date: string; generated_at: string;
  news: Item[]; new_tools: Item[]; updates: Item[]; broll: Item[];
  workflow: Item[]; trending: Item[]; recommendations: Rec[];
  tools_worth_testing: Tool[]; sources: Src[];
};

const TILES = [
  { icon: Newspaper, x: "left-[9%]", y: "top-[28%]", d: "0s" },
  { icon: Clapperboard, x: "left-[16%]", y: "top-[66%]", d: "0.9s" },
  { icon: Rocket, x: "right-[10%]", y: "top-[26%]", d: "0.5s" },
  { icon: TrendingUp, x: "right-[17%]", y: "top-[66%]", d: "1.3s" },
];

const PRIORITY_VARIANT: Record<string, "warning" | "default" | "secondary"> = {
  High: "warning", Medium: "default", Low: "secondary",
};

export default function IndustryPage() {
  const { user } = useAuth();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [history, setHistory] = useState<{ date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewDate, setViewDate] = useState<string | null>(null); // null = today
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (date: string | null) => {
    setLoading(true);
    try {
      const d = await api<Digest>(date ? `/industry/digest/${date}` : "/industry/today");
      if (mounted.current) setDigest(d);
      const h = await api<{ date: string }[]>("/industry/history");
      if (mounted.current) setHistory(h);
    } catch {
      /* surfaced via the empty state below */
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(viewDate); }, [viewDate, load]);

  async function refresh() {
    setRefreshing(true);
    try {
      const d = await api<Digest>("/industry/refresh", { method: "POST" });
      setDigest(d);
      setViewDate(null);
    } catch {} finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHero
        eyebrow="Industry Monitoring"
        icon={Radar}
        title={<>Never edit on <span className="text-gradient">yesterday&apos;s tools</span></>}
        subtitle="A live knowledge hub: AI video editing, AI B-roll, new tools, feature updates and emerging workflows — monitored daily from trusted sources, with links to every original announcement."
        tiles={TILES}
      />

      {/* Header row: date, history, refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Daily AI Video Editing Update</h2>
          <p className="text-sm text-muted-foreground">
            {digest ? <>Date: <span className="font-medium text-foreground">{digest.date}</span></> : "Loading today's report…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {history.slice(0, 7).map((h) => (
            <button
              key={h.date}
              onClick={() => setViewDate(h.date === new Date().toISOString().slice(0, 10) ? null : h.date)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${digest?.date === h.date ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}
            >
              <CalendarDays className="h-3 w-3" /> {h.date.slice(5)}
            </button>
          ))}
          {user?.is_admin && (
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh now
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 p-14 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Scanning the monitored sources — first load of the day builds the report…
          </CardContent>
        </Card>
      )}

      {!loading && !digest && (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the digest. Try again shortly.
          </CardContent>
        </Card>
      )}

      {!loading && digest && (
        <div className="space-y-8">
          <Section icon={Newspaper} emoji="📰" title="Latest AI News" items={digest.news}
            empty="No significant AI news crossed the monitored sources in this window." />

          {/* New tools get the richer anatomy */}
          <div>
            <SectionHeader icon={Clapperboard} emoji="🎬" title="New AI Video Editing Tools" />
            {digest.new_tools.length ? (
              <div className="grid gap-4 stagger md:grid-cols-2">
                {digest.new_tools.map((t, i) => (
                  <Card key={i} className="lift">
                    <CardContent className="p-5">
                      <ItemHead item={t} />
                      <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
                      <div className="mt-3 space-y-1.5 text-sm">
                        <p><span className="font-medium text-primary">Why it matters: </span><span className="text-foreground/90">{t.why}</span></p>
                        <p><span className="font-medium text-foreground/80">Who it&apos;s for: </span><span className="text-muted-foreground">{t.who}</span></p>
                        <p><span className="font-medium text-emerald-500">Worth testing? </span><span className="text-foreground/90">{t.worth_testing}</span></p>
                      </div>
                      <ReadMore url={t.url} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <EmptyNote text="No new tool launches detected in this window." />}
          </div>

          <Section icon={Rocket} emoji="🚀" title="Updates to Existing Tools" items={digest.updates} toolBadge
            empty="No official vendor updates (Runway, Adobe, CapCut, Descript, VEED, Canva, Luma, Pika, Kling) in this window." />

          <Section icon={Video} emoji="🎥" title="AI B-roll & Stock Footage" items={digest.broll}
            empty="No B-roll / stock-footage developments in this window." />

          <Section icon={Zap} emoji="⚡" title="Workflow Improvements" items={digest.workflow}
            empty="No workflow techniques surfaced in this window." />

          {/* Tools Worth Testing — the running list */}
          <div>
            <SectionHeader icon={TestTube2} emoji="🧪" title="Tools Worth Testing" note="running list — curated + auto-discovered" />
            <div className="grid gap-4 stagger md:grid-cols-2">
              {digest.tools_worth_testing.map((t) => (
                <Card key={t.tool} className="lift">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{t.tool}</h4>
                      <Badge variant={PRIORITY_VARIANT[t.priority] || "secondary"}>{t.priority}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{t.description}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="font-medium text-foreground/80">Use case: </span><span className="text-muted-foreground">{t.use_case}</span></p>
                      <p><span className="font-medium text-emerald-500">Advantages: </span><span className="text-muted-foreground">{t.advantages}</span></p>
                      <p><span className="font-medium text-rose-400">Limitations: </span><span className="text-muted-foreground">{t.limitations}</span></p>
                    </div>
                    <ReadMore url={t.url} label="Open tool" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Section icon={TrendingUp} emoji="📈" title="Trending Techniques" items={digest.trending}
            empty="No trend signals from the communities in this window." />

          {/* Team recommendations */}
          <div>
            <SectionHeader icon={CheckCircle2} emoji="✅" title="Team Recommendations" />
            <div className="space-y-3">
              {digest.recommendations.map((r, i) => (
                <Card key={i} className="border-primary/25">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{r.title}</h4>
                      <Badge variant="default">{r.verdict}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{r.detail}</p>
                    <p className="mt-1 text-sm"><span className="font-medium text-foreground/80">Impact: </span><span className="text-muted-foreground">{r.impact}</span></p>
                    {r.url && <ReadMore url={r.url} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <SectionHeader icon={Link2} emoji="🔗" title="Sources" note="every update links to its original announcement" />
            <Card>
              <CardContent className="p-5">
                {["AI News", "AI Video Editing", "AI B-roll & Stock", "Community & Trends"].map((g) => (
                  <div key={g} className="mb-3 last:mb-0">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</div>
                    <div className="flex flex-wrap gap-2">
                      {digest.sources.filter((s) => s.group === g).map((s) => (
                        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
                          {s.name} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section building blocks ───────────────────────────────── */
function SectionHeader({ icon: Icon, emoji, title, note }: { icon: any; emoji: string; title: string; note?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold">{emoji} {title}</h3>
      {note && <span className="text-sm text-muted-foreground">— {note}</span>}
    </div>
  );
}

function ItemHead({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h4 className="font-semibold leading-snug">{item.title}</h4>
      <Badge variant="secondary">{item.source}</Badge>
      {item.date && <span className="text-xs text-muted-foreground">{item.date}</span>}
    </div>
  );
}

function ReadMore({ url, label = "Read the original" }: { url: string; label?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{text}</p>;
}

function Section({ icon, emoji, title, items, empty, toolBadge }: {
  icon: any; emoji: string; title: string; items: Item[]; empty: string; toolBadge?: boolean;
}) {
  return (
    <div>
      <SectionHeader icon={icon} emoji={emoji} title={title} />
      {items.length ? (
        <div className="space-y-3 stagger">
          {items.map((it, i) => (
            <Card key={i} className="lift">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {toolBadge && it.tool && <Badge variant="default">{it.tool}</Badge>}
                  <h4 className="font-semibold leading-snug">{it.title}</h4>
                  <Badge variant="secondary">{it.source}</Badge>
                  {it.date && <span className="text-xs text-muted-foreground">{it.date}</span>}
                </div>
                {it.summary && <p className="mt-1.5 text-sm text-muted-foreground">{it.summary}</p>}
                <ReadMore url={it.url} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyNote text={empty} />}
    </div>
  );
}
