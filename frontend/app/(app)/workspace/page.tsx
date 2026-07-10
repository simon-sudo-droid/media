"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase, FileText, NotebookPen, Library, Sparkles as SparkIcon, TrendingUp,
  ExternalLink, Plus, Loader2, Trash2, Search, ChevronDown, ChevronUp, Flame,
  CheckCircle2, Lightbulb, Link2, GraduationCap, Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";

/* ── Types (mirror /workspace API) ─────────────────────────── */
type Content = {
  id: number; category: string; title: string; content_type: string; platform: string;
  body: string; status: string; notes: string; links: string[]; updated_at: string;
};
type Entry = {
  id: number; user_id: number; user_name: string; entry_date: string; title: string;
  resource_type: string; url: string; summary: string; takeaways: string;
  workflow_impact: string; apply_plan: string; tags: string[];
  why_useful: string; project_target: string; do_differently: string;
  team_adopt: boolean; worth_sharing: boolean;
};
type Progress = {
  completed: number; team_total: number; weekly_streak: number; topics_explored: number;
  tools_learned: string[]; top_subjects: { tag: string; count: number }[];
  types: { type: string; count: number }[];
};
type Reco = { topic: string; title: string; url: string; note: string; source?: string; date?: string };

const TILES = [
  { icon: FileText, x: "left-[9%]", y: "top-[28%]", d: "0s" },
  { icon: NotebookPen, x: "left-[16%]", y: "top-[66%]", d: "0.9s" },
  { icon: Library, x: "right-[10%]", y: "top-[26%]", d: "0.5s" },
  { icon: TrendingUp, x: "right-[17%]", y: "top-[66%]", d: "1.3s" },
];

const TABS = [
  { key: "content", label: "Current Content", icon: FileText },
  { key: "log", label: "Weekly Learning Log", icon: NotebookPen },
  { key: "library", label: "Shared Library", icon: Library },
  { key: "recommended", label: "Recommended", icon: SparkIcon },
  { key: "progress", label: "Learning Progress", icon: TrendingUp },
];

const STATUSES = ["Draft", "Ready for Edit", "In Editing", "In Review", "Published"];
const STATUS_VARIANT: Record<string, "secondary" | "warning" | "default" | "success"> = {
  "Draft": "secondary", "Ready for Edit": "warning", "In Editing": "default",
  "In Review": "warning", "Published": "success",
};
const CONTENT_TYPES = ["Script", "LinkedIn post", "Instagram content", "Facebook content", "Article", "Reel script", "Supporting asset"];
const RESOURCE_TYPES = ["Video", "Article", "Course", "Blog", "Tool", "Prompt", "Podcast", "Other"];

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary";

export default function WorkspacePage() {
  const [tab, setTab] = useState("content");
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHero
        eyebrow="Content Workspace"
        icon={Briefcase}
        title={<>Learn it. <span className="text-gradient">Apply it. Ship it.</span></>}
        subtitle="Your central workspace: the real content you're editing, what you're learning each week, the team's shared knowledge — all in one place, no tab-switching."
        tiles={TILES}
      />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "content" && <div className="pop-open"><ContentTab /></div>}
      {tab === "log" && <div className="pop-open"><LogTab /></div>}
      {tab === "library" && <div className="pop-open"><LibraryTab /></div>}
      {tab === "recommended" && <div className="pop-open"><RecommendedTab /></div>}
      {tab === "progress" && <div className="pop-open"><ProgressTab /></div>}
    </div>
  );
}

/* ── 1) Current Content Workspace ──────────────────────────── */
function ContentTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: "leadership", title: "", content_type: "Script", platform: "", body: "", status: "Draft", notes: "", links: "" });

  const load = useCallback(() => {
    api<Content[]>("/workspace/content").then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function save() {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await api("/workspace/content", { method: "POST", body: form });
      setForm({ ...form, title: "", body: "", notes: "", links: "" });
      setAdding(false);
      load();
    } finally { setBusy(false); }
  }
  async function setStatus(c: Content, status: string) {
    await api(`/workspace/content/${c.id}`, { method: "PATCH", body: { status } });
    load();
  }
  async function remove(c: Content) {
    await api(`/workspace/content/${c.id}`, { method: "DELETE" });
    load();
  }

  const groups = [
    { key: "leadership", title: "Monthly Leadership Content", hint: "LinkedIn posts, Instagram & Facebook content, scripts and supporting assets." },
    { key: "case_study", title: "Leadership Case Studies", hint: "Articles, Instagram content, reel scripts and supporting materials." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">The actual content the team is editing — apply what you learn directly here.</p>
        <Button variant="gradient" size="sm" onClick={() => setAdding((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add content
        </Button>
      </div>

      {adding && (
        <Card className="animate-in"><CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <input className={inputCls + " sm:col-span-2"} placeholder="Title (e.g. July LinkedIn post — 'Delegation myths')" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="leadership">Monthly Leadership Content</option>
            <option value="case_study">Leadership Case Studies</option>
          </select>
          <select className={inputCls} value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}>
            {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className={inputCls} placeholder="Platform (LinkedIn, Instagram, Facebook…)" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
          <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <textarea className={inputCls + " min-h-[120px] sm:col-span-2"} placeholder="Script / body…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <textarea className={inputCls + " min-h-[60px]"} placeholder="Notes for the editor…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <textarea className={inputCls + " min-h-[60px]"} placeholder={"Supporting links — one per line\nhttps://docs.google.com/…"} value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" disabled={busy || !form.title.trim()} onClick={save}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save content
            </Button>
          </div>
        </CardContent></Card>
      )}

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading workspace…</p>}

      {!loading && groups.map((g) => {
        const rows = items.filter((c) => c.category === g.key);
        return (
          <section key={g.key} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{rows.length} item{rows.length === 1 ? "" : "s"}</span>
            </div>
            {rows.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nothing here yet. {g.hint} Use <span className="font-medium text-foreground">Add content</span> to bring the team&apos;s documents in.
              </p>
            )}
            <div className="space-y-3">
              {rows.map((c) => <ContentCard key={c.id} c={c} isAdmin={!!user?.is_admin} onStatus={setStatus} onDelete={remove} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ContentCard({ c, isAdmin, onStatus, onDelete }: {
  c: Content; isAdmin: boolean; onStatus: (c: Content, s: string) => void; onDelete: (c: Content) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="lift">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{c.title}</h3>
          <Badge variant="secondary">{c.content_type}</Badge>
          {c.platform && <Badge variant="outline">{c.platform}</Badge>}
          <Badge variant={STATUS_VARIANT[c.status] || "secondary"}>{c.status}</Badge>
          <div className="ml-auto flex items-center gap-2">
            <select
              className="rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none focus:border-primary"
              value={c.status}
              onChange={(e) => onStatus(c, e.target.value)}
              title="Update status"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {isAdmin && (
              <button onClick={() => onDelete(c)} className="text-muted-foreground hover:text-rose-400" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {c.notes && <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Notes: </span>{c.notes}</p>}
        {c.body && (
          <div className="mt-3">
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {open ? "Hide script / body" : "View script / body"}
            </button>
            {open && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-secondary/40 p-4 text-sm leading-relaxed text-foreground/90">{c.body}</p>}
          </div>
        )}
        {c.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {c.links.map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
                <Link2 className="h-3 w-3" /> Doc {i + 1} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── 2) Weekly Learning Log (+ 6. Knowledge-to-Action) ─────── */
const EMPTY_ENTRY = {
  entry_date: "", title: "", resource_type: "Video", url: "", summary: "", takeaways: "",
  workflow_impact: "", apply_plan: "", tags: "", why_useful: "", project_target: "",
  do_differently: "", team_adopt: false, worth_sharing: false,
};

function LogTab() {
  const [mine, setMine] = useState<Entry[]>([]);
  const [form, setForm] = useState({ ...EMPTY_ENTRY });
  const [busy, setBusy] = useState(false);
  const [k2a, setK2a] = useState(false);

  const load = useCallback(() => {
    api<Entry[]>("/workspace/learning?mine=true").then(setMine).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function save() {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await api("/workspace/learning", { method: "POST", body: form });
      setForm({ ...EMPTY_ENTRY });
      setK2a(false);
      load();
    } finally { setBusy(false); }
  }
  async function remove(e: Entry) {
    await api(`/workspace/learning/${e.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/25"><CardContent className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="font-semibold">Log this week&apos;s learning</h3>
          <p className="text-sm text-muted-foreground">Every entry feeds the team&apos;s shared library — one editor learns, everyone benefits.</p>
        </div>
        <input className={inputCls + " sm:col-span-2"} placeholder="Resource title (e.g. 'How to cut b-roll to the beat — Daniel Schiffer')" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className={inputCls} value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value })}>
          {RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input className={inputCls} type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
        <input className={inputCls + " sm:col-span-2"} placeholder="Source link (https://…)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <textarea className={inputCls + " min-h-[70px] sm:col-span-2"} placeholder="What did you learn? (summary)" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea className={inputCls + " min-h-[60px]"} placeholder="Key takeaways…" value={form.takeaways} onChange={(e) => setForm({ ...form, takeaways: e.target.value })} />
        <textarea className={inputCls + " min-h-[60px]"} placeholder="How can it improve our editing workflow?" value={form.workflow_impact} onChange={(e) => setForm({ ...form, workflow_impact: e.target.value })} />
        <input className={inputCls + " sm:col-span-2"} placeholder="Tags — comma separated (AI, Premiere Pro, Runway, Hooks, B-roll…)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

        {/* Knowledge → Action */}
        <div className="sm:col-span-2">
          <button onClick={() => setK2a((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <Lightbulb className="h-4 w-4" /> Knowledge → Action {k2a ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {k2a && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <textarea className={inputCls + " min-h-[50px]"} placeholder="Why is this useful?" value={form.why_useful} onChange={(e) => setForm({ ...form, why_useful: e.target.value })} />
              <textarea className={inputCls + " min-h-[50px]"} placeholder="Which project can you apply it to?" value={form.project_target} onChange={(e) => setForm({ ...form, project_target: e.target.value })} />
              <textarea className={inputCls + " min-h-[50px]"} placeholder="What will you do differently?" value={form.do_differently} onChange={(e) => setForm({ ...form, do_differently: e.target.value })} />
              <textarea className={inputCls + " min-h-[50px]"} placeholder="How will you apply it? (plan)" value={form.apply_plan} onChange={(e) => setForm({ ...form, apply_plan: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.team_adopt} onChange={(e) => setForm({ ...form, team_adopt: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                The team should adopt this workflow
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.worth_sharing} onChange={(e) => setForm({ ...form, worth_sharing: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Worth sharing with everyone
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end sm:col-span-2">
          <Button variant="gradient" size="sm" disabled={busy || !form.title.trim()} onClick={save}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log learning
          </Button>
        </div>
      </CardContent></Card>

      <section className="space-y-3">
        <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">My entries</h2><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">{mine.length} logged</span></div>
        {mine.length === 0 && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No entries yet — log the first thing you learned this week.</p>}
        <div className="space-y-3">
          {mine.map((e) => <EntryCard key={e.id} e={e} onDelete={() => remove(e)} />)}
        </div>
      </section>
    </div>
  );
}

/* ── 3) Shared Learning Library ────────────────────────────── */
function LibraryTab() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [rtype, setRtype] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((query: string, t: string, rt: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (t) params.set("tag", t);
    if (rt) params.set("rtype", rt);
    api<Entry[]>(`/workspace/learning?${params.toString()}`).then(setEntries).catch(() => {});
  }, []);
  useEffect(() => { load("", "", ""); }, [load]);

  function search(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(v, tag, rtype), 300);
  }

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => e.tags.forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t);
  }, [entries]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => search(e.target.value)} placeholder="Search by topic, tool, creator, platform, tag…"
            className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select className={inputCls + " sm:w-44"} value={rtype} onChange={(e) => { setRtype(e.target.value); load(q, tag, e.target.value); }}>
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <button key={t} onClick={() => { const next = tag === t ? "" : t; setTag(next); load(q, next, rtype); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tag === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          The team library is empty (or nothing matches). Entries logged in the Weekly Learning Log appear here automatically.
        </p>
      )}
      <div className="space-y-3">
        {entries.map((e) => <EntryCard key={e.id} e={e} showAuthor />)}
      </div>
    </div>
  );
}

function EntryCard({ e, showAuthor, onDelete }: { e: Entry; showAuthor?: boolean; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  const hasK2a = e.why_useful || e.project_target || e.do_differently || e.apply_plan;
  return (
    <Card className="lift">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold leading-snug">{e.title}</h3>
          <Badge variant="secondary">{e.resource_type}</Badge>
          {e.worth_sharing && <Badge variant="warning">⭐ Team pick</Badge>}
          {e.team_adopt && <Badge variant="success">Adopt</Badge>}
          <span className="text-xs text-muted-foreground">{e.entry_date}{showAuthor && e.user_name ? ` · ${e.user_name}` : ""}</span>
          {onDelete && (
            <button onClick={onDelete} className="ml-auto text-muted-foreground hover:text-rose-400" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {e.summary && <p className="mt-2 text-sm text-foreground/90"><span className="font-medium text-primary">Learned: </span>{e.summary}</p>}
        {e.takeaways && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Takeaways: </span>{e.takeaways}</p>}
        {e.workflow_impact && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Workflow impact: </span>{e.workflow_impact}</p>}
        {e.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {e.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">#{t}</span>)}
          </div>
        )}
        {hasK2a && (
          <div className="mt-3">
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Lightbulb className="h-4 w-4" /> Knowledge → Action {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open && (
              <div className="mt-2 space-y-1 rounded-lg bg-secondary/40 p-4 text-sm">
                {e.why_useful && <p><span className="font-medium text-foreground/80">Why useful: </span><span className="text-muted-foreground">{e.why_useful}</span></p>}
                {e.project_target && <p><span className="font-medium text-foreground/80">Apply to: </span><span className="text-muted-foreground">{e.project_target}</span></p>}
                {e.do_differently && <p><span className="font-medium text-foreground/80">Do differently: </span><span className="text-muted-foreground">{e.do_differently}</span></p>}
                {e.apply_plan && <p><span className="font-medium text-foreground/80">Plan: </span><span className="text-muted-foreground">{e.apply_plan}</span></p>}
              </div>
            )}
          </div>
        )}
        {e.url && (
          <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Open resource <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

/* ── 4) Recommended Weekly Learning ────────────────────────── */
function RecommendedTab() {
  const [data, setData] = useState<{ fresh: Reco[]; curated: Reco[] } | null>(null);
  useEffect(() => { api("/workspace/recommendations").then(setData).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /><h2 className="text-lg font-semibold">Fresh this week</h2><span className="text-sm text-muted-foreground">— surfaced by Industry Monitoring</span></div>
        {!data && <p className="py-4 text-sm text-muted-foreground">Loading…</p>}
        {data && data.fresh.length === 0 && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No fresh picks yet — check back after today&apos;s industry digest builds.</p>}
        <div className="grid gap-4 stagger md:grid-cols-2">
          {data?.fresh.map((r, i) => (
            <Card key={i} className="lift"><CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{r.topic}</Badge>
                {r.source && <Badge variant="secondary">{r.source}</Badge>}
                {r.date && <span className="text-xs text-muted-foreground">{r.date}</span>}
              </div>
              <h3 className="mt-2 font-semibold leading-snug">{r.title}</h3>
              {r.note && <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Explore <ExternalLink className="h-3.5 w-3.5" /></a>}
            </CardContent></Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Evergreen essentials</h2><span className="text-sm text-muted-foreground">— the highest-quality resource per craft area</span></div>
        <div className="grid gap-4 stagger md:grid-cols-2 lg:grid-cols-3">
          {data?.curated.map((r) => (
            <Card key={r.title} className="lift h-full"><CardContent className="flex h-full flex-col p-5">
              <Badge variant="secondary" className="self-start">{r.topic}</Badge>
              <h3 className="mt-2 font-semibold leading-snug">{r.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.note}</p>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Start learning <ExternalLink className="h-3.5 w-3.5" /></a>
            </CardContent></Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── 5) Learning Progress ──────────────────────────────────── */
function ProgressTab() {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => { api("/workspace/progress").then(setP).catch(() => {}); }, []);

  if (!p) return <p className="py-8 text-center text-sm text-muted-foreground">Loading progress…</p>;

  const stats = [
    { icon: CheckCircle2, label: "Resources completed", value: String(p.completed), accent: "text-emerald-400" },
    { icon: Flame, label: "Weekly learning streak", value: `${p.weekly_streak} wk`, accent: "text-orange-400" },
    { icon: Library, label: "Topics explored", value: String(p.topics_explored), accent: "text-primary" },
    { icon: Wrench, label: "Tools learned", value: String(p.tools_learned.length), accent: "text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 stagger sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-4 p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-lg bg-secondary ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-xl font-bold">{s.value}</div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardContent className="p-5">
          <h3 className="mb-3 font-semibold">Most studied subjects</h3>
          {p.top_subjects.length === 0 && <p className="text-sm text-muted-foreground">Log entries with tags to see your focus areas.</p>}
          <div className="space-y-2">
            {p.top_subjects.map((s, i) => (
              <div key={s.tag} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                <span className="text-sm font-medium">{i + 1}. {s.tag}</span>
                <Badge variant="default">{s.count} {s.count === 1 ? "entry" : "entries"}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="mb-3 font-semibold">Tools learned</h3>
          {p.tools_learned.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tag entries with tool names (Runway, Premiere Pro…) or log resources of type &quot;Tool&quot;.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {p.tools_learned.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}
          <h3 className="mb-3 mt-6 font-semibold">By resource type</h3>
          <div className="flex flex-wrap gap-2">
            {p.types.map((t) => <Badge key={t.type} variant="outline">{t.type}: {t.count}</Badge>)}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Team total: {p.team_total} resources logged across all editors.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
