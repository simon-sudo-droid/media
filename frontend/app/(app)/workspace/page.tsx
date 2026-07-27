"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase, FileText, NotebookPen, Library, TrendingUp, ExternalLink, Plus,
  Loader2, Trash2, Search, ChevronDown, ChevronUp, Flame, CheckCircle2,
  Lightbulb, Link2, Wrench, Pencil, Save, X, History, Copy, Check, Clock,
  User as UserIcon, CalendarDays, Sparkles, LayoutList, Columns3, RotateCcw,
  AlertTriangle, Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ── Types (mirror /workspace API) ─────────────────────────── */
type DocLink = { name: string; url: string };
type Technique = { id: number; title: string; url: string; user_name: string; tags: string[]; apply_plan: string };
type Content = {
  id: number; category: string; title: string; content_type: string; platform: string;
  body: string; status: string; notes: string; links: DocLink[]; owner: string;
  due_date: string; word_count: number; runtime: string; updated_at: string;
  version_count?: number; techniques?: Technique[];
};
type Entry = {
  id: number; user_id: number; user_name: string; entry_date: string; title: string;
  resource_type: string; url: string; summary: string; takeaways: string;
  workflow_impact: string; apply_plan: string; tags: string[];
  why_useful: string; project_target: string; do_differently: string;
  team_adopt: boolean; worth_sharing: boolean; content_id: number | null; content_title: string;
};
type Progress = {
  completed: number; team_total: number; weekly_streak: number; topics_explored: number;
  tools_learned: string[]; top_subjects: { tag: string; count: number }[];
  types: { type: string; count: number }[];
};
type Version = { id: number; edited_at: string; edited_by: string; word_count: number; preview: string; body: string };
type Analysis = {
  word_count: number; runtime: string; sentences: number; paragraphs: number;
  avg_sentence_words: number; method: string;
  flags: { kind: string; detail: string; sample: string }[];
  hook: { line: string; notes: string[] };
  beats: { n: number; text: string; shot: string; words: number; runtime: string }[];
};

const TABS = [
  { key: "content", label: "Current Content", icon: FileText },
  { key: "log", label: "Weekly Learning Log", icon: NotebookPen },
  { key: "library", label: "Shared Library", icon: Library },
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

/* Natural sort so "Month 2" precedes "Month 10". */
const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export default function WorkspacePage() {
  const [tab, setTab] = useState("content");
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Compact single-line header (was a full-height marketing hero). */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Content Workspace</h1>
          <p className="truncate text-sm text-muted-foreground">The work you&apos;re editing, what you&apos;re learning, and the team&apos;s knowledge — in one place.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "content" && <ContentTab />}
      {tab === "log" && <LogTab />}
      {tab === "library" && <LibraryTab />}
      {tab === "progress" && <ProgressTab />}
    </div>
  );
}

/* ── 1) Current Content ────────────────────────────────────── */
function ContentTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");
  const [fStatus, setFStatus] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [sort, setSort] = useState("updated");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    category: "leadership", title: "", content_type: "Script", platform: "",
    body: "", status: "Draft", notes: "", links: "", owner: "", due_date: "",
  });

  const load = useCallback(() => {
    api<Content[]>("/workspace/content").then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function save() {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await api("/workspace/content", { method: "POST", body: form });
      setForm({ ...form, title: "", body: "", notes: "", links: "", due_date: "" });
      setAdding(false);
      load();
    } finally { setBusy(false); }
  }
  const patch = useCallback(async (c: Content, data: Partial<Content>) => {
    const updated = await api<Content>(`/workspace/content/${c.id}`, { method: "PATCH", body: data });
    setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    return updated;
  }, []);
  async function remove(c: Content) {
    await api(`/workspace/content/${c.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== c.id));
  }

  const owners = useMemo(
    () => [...new Set(items.map((i) => i.owner).filter(Boolean))].sort(natural),
    [items],
  );

  const visible = useMemo(() => {
    let rows = items;
    if (fStatus) rows = rows.filter((r) => r.status === fStatus);
    if (fOwner) rows = rows.filter((r) => r.owner === fOwner);
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.title.toLowerCase().includes(n) || r.body.toLowerCase().includes(n) ||
        r.notes.toLowerCase().includes(n) || (r.platform || "").toLowerCase().includes(n));
    }
    const sorted = [...rows];
    if (sort === "title") sorted.sort((a, b) => natural(a.title, b.title));
    else if (sort === "due") sorted.sort((a, b) => natural(a.due_date || "9999", b.due_date || "9999"));
    else if (sort === "status") sorted.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
    else sorted.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    return sorted;
  }, [items, fStatus, fOwner, q, sort]);

  const groups = [
    { key: "leadership", title: "Monthly Leadership Content", hint: "LinkedIn posts, Instagram & Facebook content, scripts and supporting assets." },
    { key: "case_study", title: "Leadership Case Studies", hint: "Articles, Instagram content, reel scripts and supporting materials." },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar: search, filters, sort, view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, script, notes…"
            className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <select className={inputCls + " w-auto"} value={fStatus} onChange={(e) => setFStatus(e.target.value)} title="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {owners.length > 0 && (
          <select className={inputCls + " w-auto"} value={fOwner} onChange={(e) => setFOwner(e.target.value)} title="Filter by owner">
            <option value="">All owners</option>
            {owners.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}
        <select className={inputCls + " w-auto"} value={sort} onChange={(e) => setSort(e.target.value)} title="Sort">
          <option value="updated">Recently updated</option>
          <option value="due">Due date</option>
          <option value="title">Title (natural)</option>
          <option value="status">Pipeline stage</option>
        </select>
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button onClick={() => setView("list")} title="List view"
            className={`px-2.5 py-2 ${view === "list" ? "bg-primary/10 text-primary" : "hover:bg-secondary/60"}`}>
            <LayoutList className="h-4 w-4" />
          </button>
          <button onClick={() => setView("board")} title="Board view"
            className={`px-2.5 py-2 ${view === "board" ? "bg-primary/10 text-primary" : "hover:bg-secondary/60"}`}>
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setAdding((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add content
        </Button>
      </div>

      {(fStatus || fOwner || q) && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> Showing {visible.length} of {items.length}
          <button onClick={() => { setFStatus(""); setFOwner(""); setQ(""); }} className="ml-1 font-medium text-primary hover:underline">Clear</button>
        </p>
      )}

      {adding && (
        <Card className="animate-in"><CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <input className={inputCls + " sm:col-span-2"} placeholder="Title (e.g. Month 5 — LinkedIn: 'Delegation myths')" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="leadership">Monthly Leadership Content</option>
            <option value="case_study">Leadership Case Studies</option>
          </select>
          <select className={inputCls} value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}>
            {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className={inputCls} placeholder="Platform (LinkedIn, Instagram…)" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
          <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className={inputCls} placeholder="Owner / editor" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className={inputCls} type="date" title="Due date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <textarea className={inputCls + " min-h-[120px] sm:col-span-2"} placeholder="Script / body…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <textarea className={inputCls + " min-h-[60px]"} placeholder="Notes for the editor…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <textarea className={inputCls + " min-h-[60px]"} placeholder={"Supporting docs — one per line:\nMonth 5 script | https://docs.google.com/…"} value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" disabled={busy || !form.title.trim()} onClick={save}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save content
            </Button>
          </div>
        </CardContent></Card>
      )}

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading workspace…</p>}

      {/* Board view — four pipeline columns, click a card's status to advance */}
      {!loading && view === "board" && (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-full gap-4">
            {STATUSES.map((s) => {
              const col = visible.filter((c) => c.status === s);
              return (
                <div key={s} className="w-[280px] shrink-0">
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <span className="text-sm font-semibold">{s}</span>
                    <Badge variant="secondary">{col.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {col.map((c) => (
                      <Card key={c.id} className="lift">
                        <CardContent className="min-w-0 p-3">
                          <p className="break-words text-sm font-medium">{c.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <Badge variant="secondary">{c.content_type}</Badge>
                            {c.owner && <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" />{c.owner}</span>}
                            {c.word_count > 0 && <span>{c.runtime}</span>}
                          </div>
                          <select
                            className="mt-2 w-full rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                            value={c.status}
                            onChange={(e) => patch(c, { status: e.target.value })}
                          >
                            {STATUSES.map((st) => <option key={st}>{st}</option>)}
                          </select>
                        </CardContent>
                      </Card>
                    ))}
                    {col.length === 0 && <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Empty</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view — grouped by category */}
      {!loading && view === "list" && groups.map((g) => {
        const rows = visible.filter((c) => c.category === g.key);
        return (
          <section key={g.key} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{rows.length} item{rows.length === 1 ? "" : "s"}</span>
            </div>
            {rows.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nothing here{items.length ? " matching the filters" : ""}. {g.hint}
              </p>
            )}
            <div className="space-y-3">
              {rows.map((c) => (
                <ContentCard key={c.id} c={c} isAdmin={!!user?.is_admin} onPatch={patch} onDelete={remove} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ContentCard({ c, isAdmin, onPatch, onDelete }: {
  c: Content; isAdmin: boolean;
  onPatch: (c: Content, data: Partial<Content>) => Promise<Content>;
  onDelete: (c: Content) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const autosave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = editing
    ? draft.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length
    : c.word_count;
  const runtime = useMemo(() => {
    const total = Math.round((words / 150) * 60);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }, [words]);

  const persist = useCallback(async (body: string) => {
    setSaving(true);
    try {
      await onPatch(c, { body });
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } finally { setSaving(false); }
  }, [c, onPatch]);

  // Autosave 1.5s after typing stops, so nothing is lost to a closed tab.
  function onDraftChange(v: string) {
    setDraft(v);
    if (autosave.current) clearTimeout(autosave.current);
    autosave.current = setTimeout(() => { if (v !== c.body) persist(v); }, 1500);
  }
  useEffect(() => () => { if (autosave.current) clearTimeout(autosave.current); }, []);

  async function saveNow() {
    if (autosave.current) clearTimeout(autosave.current);
    if (draft !== c.body) await persist(draft);
    setEditing(false);
  }
  function cancelEdit() {
    if (autosave.current) clearTimeout(autosave.current);
    setDraft(c.body);
    setEditing(false);
  }
  async function copyScript() {
    try {
      await navigator.clipboard.writeText(c.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }
  async function loadHistory() {
    setShowHistory((v) => !v);
    if (!versions.length) {
      try { setVersions(await api<Version[]>(`/workspace/content/${c.id}/versions`)); } catch {}
    }
  }
  async function restore(v: Version) {
    const updated = await api<Content>(`/workspace/content/${c.id}/versions/${v.id}/restore`, { method: "POST" });
    setDraft(updated.body);
    setVersions(await api<Version[]>(`/workspace/content/${c.id}/versions`));
  }
  async function runAnalysis() {
    setAnalyzing(true);
    try { setAnalysis(await api<Analysis>(`/workspace/content/${c.id}/analyze`)); }
    finally { setAnalyzing(false); }
  }

  const overdue = c.due_date && c.due_date < new Date().toISOString().slice(0, 10) && c.status !== "Published";

  return (
    <Card className="lift overflow-hidden" {...(open || editing ? { "data-no-tilt": "" } : {})}>
      <CardContent className="min-w-0 p-5">
        {/* Header — the status pill IS the control (no duplicate dropdown) */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 break-words font-semibold">{c.title}</h3>
          <Badge variant="secondary">{c.content_type}</Badge>
          {c.platform && <Badge variant="outline">{c.platform}</Badge>}
          <StatusPill status={c.status} onChange={(s) => onPatch(c, { status: s })} />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {(c.version_count ?? 0) > 0 && (
              <button onClick={loadHistory} title="Version history"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <History className="h-3.5 w-3.5" /> {c.version_count}
              </button>
            )}
            {isAdmin && (
              confirmDel ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1">
                  <span className="text-xs font-medium text-rose-400">Delete?</span>
                  <button onClick={() => onDelete(c)} className="text-xs font-semibold text-rose-400 hover:underline">Yes</button>
                  <button onClick={() => setConfirmDel(false)} className="text-xs text-muted-foreground hover:text-foreground">No</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="text-muted-foreground hover:text-rose-400" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Meta strip: owner, due date, length */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <InlineText value={c.owner} placeholder="Unassigned" onSave={(v) => onPatch(c, { owner: v })} />
          </span>
          <span className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-rose-400" : ""}`}>
            <CalendarDays className="h-3 w-3" />
            <InlineDate value={c.due_date} onSave={(v) => onPatch(c, { due_date: v })} />
            {overdue && " (overdue)"}
          </span>
          {c.word_count > 0 && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.word_count} words · ~{c.runtime}</span>
          )}
          {c.updated_at && <span>Updated {c.updated_at.slice(0, 10)}</span>}
        </div>

        {c.notes && <p className="mt-2 break-words text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Notes: </span>{c.notes}</p>}

        {/* Techniques logged against this content (learning → doing) */}
        {(c.techniques?.length ?? 0) > 0 && (
          <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Apply what the team learned
            </div>
            <ul className="space-y-1.5">
              {c.techniques!.map((t) => (
                <li key={t.id} className="text-sm">
                  <span className="font-medium">{t.title}</span>
                  {t.tags.length > 0 && <span className="ml-1.5 text-xs text-primary">{t.tags.map((x) => `#${x}`).join(" ")}</span>}
                  {t.apply_plan && <span className="block text-xs text-muted-foreground">Plan: {t.apply_plan}</span>}
                  {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open resource ↗</a>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Script: view / edit / analyze */}
        {(c.body || editing) && (
          <div className="mt-3 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {open ? "Hide script" : "View script"}
              </button>
              {open && !editing && (
                <>
                  <button onClick={() => { setDraft(c.body); setEditing(true); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={copyScript} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                  </button>
                  <button onClick={runAnalysis} disabled={analyzing} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />} Analyze
                  </button>
                </>
              )}
              {editing && (
                <>
                  <Button size="sm" variant="gradient" onClick={saveNow} className="h-7 gap-1 px-2.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 gap-1 px-2.5">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {saving ? "Saving…" : savedAt ? `Saved ${savedAt}` : "Autosaves as you type"} · {words} words · ~{runtime}
                  </span>
                </>
              )}
            </div>

            {open && !editing && (
              <div className="mt-2 max-h-[65vh] overflow-y-auto overscroll-contain rounded-lg bg-secondary/40 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">{c.body}</p>
              </div>
            )}
            {editing && (
              <textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                className="mt-2 min-h-[320px] w-full rounded-lg border border-input bg-card p-4 text-sm leading-relaxed outline-none focus:border-primary"
                placeholder="Write or paste the script…"
              />
            )}

            {/* Analysis panel */}
            {open && analysis && (
              <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold">Script analysis</span>
                  <span className="text-muted-foreground">{analysis.word_count} words · ~{analysis.runtime} · {analysis.sentences} sentences · avg {analysis.avg_sentence_words} w/sentence</span>
                  <button onClick={() => setAnalysis(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hook</div>
                  {analysis.hook.line && <p className="mt-1 break-words text-sm italic text-foreground/90">“{analysis.hook.line}”</p>}
                  <ul className="mt-1 space-y-1">
                    {analysis.hook.notes.map((n, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {n}
                      </li>
                    ))}
                  </ul>
                </div>
                {analysis.flags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flags</div>
                    <ul className="mt-1 space-y-1.5">
                      {analysis.flags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span><span className="font-medium">{f.kind}: </span><span className="text-muted-foreground">{f.detail}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.beats.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shot list ({analysis.beats.length} beats)</div>
                    <div className="mt-1 space-y-1.5">
                      {analysis.beats.map((b) => (
                        <div key={b.n} className="rounded-md bg-card p-2.5 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default">{b.n}</Badge>
                            <span className="font-medium">{b.shot}</span>
                            <span className="text-xs text-muted-foreground">~{b.runtime}</span>
                          </div>
                          <p className="mt-1 break-words text-xs text-muted-foreground">{b.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">{analysis.method}</p>
              </div>
            )}
          </div>
        )}

        {/* Version history */}
        {showHistory && (
          <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Version history</span>
              <button onClick={() => setShowHistory(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            {versions.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No previous versions yet.</p>}
            <div className="mt-2 space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="rounded-md bg-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{v.edited_by || "Unknown"}</span>
                    <span>{v.edited_at.replace("T", " ").slice(0, 16)}</span>
                    <span>{v.word_count} words</span>
                    <button onClick={() => restore(v)} className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline">
                      <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{v.preview}…</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting docs — real names, not "Doc 1" */}
        {c.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {c.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
                <Link2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{l.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* The status pill doubles as the control — one element, not two. */
function StatusPill({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  return (
    <span className="relative inline-flex">
      <Badge variant={STATUS_VARIANT[status] || "secondary"} className="cursor-pointer gap-1 pr-1.5">
        {status} <ChevronDown className="h-3 w-3" />
      </Badge>
      <select
        aria-label="Change status"
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </span>
  );
}

/* Click-to-edit text (owner) and date (due) — no separate edit mode. */
function InlineText({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className={`hover:text-foreground hover:underline ${value ? "" : "italic"}`}>
        {value || placeholder}
      </button>
    );
  }
  return (
    <input
      autoFocus value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { setEditing(false); if (v !== value) onSave(v); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setV(value); setEditing(false); } }}
      className="w-28 rounded border border-input bg-card px-1.5 py-0.5 text-xs outline-none focus:border-primary"
    />
  );
}

function InlineDate({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className={`hover:text-foreground hover:underline ${value ? "" : "italic"}`}>
        {value || "No due date"}
      </button>
    );
  }
  return (
    <input
      type="date" autoFocus defaultValue={value}
      onBlur={(e) => { setEditing(false); if (e.target.value !== value) onSave(e.target.value); }}
      className="rounded border border-input bg-card px-1.5 py-0.5 text-xs outline-none focus:border-primary"
    />
  );
}

/* ── 2) Weekly Learning Log (+ Knowledge-to-Action) ────────── */
const EMPTY_ENTRY = {
  entry_date: "", title: "", resource_type: "Video", url: "", summary: "", takeaways: "",
  workflow_impact: "", apply_plan: "", tags: "", why_useful: "", project_target: "",
  do_differently: "", team_adopt: false, worth_sharing: false, content_id: "" as string,
};

function LogTab() {
  const [mine, setMine] = useState<Entry[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [form, setForm] = useState({ ...EMPTY_ENTRY });
  const [busy, setBusy] = useState(false);
  const [k2a, setK2a] = useState(false);

  const load = useCallback(() => {
    api<Entry[]>("/workspace/learning?mine=true").then(setMine).catch(() => {});
    api<Content[]>("/workspace/content").then(setContents).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function save() {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const { content_id, ...rest } = form;
      await api("/workspace/learning", {
        method: "POST",
        body: { ...rest, content_id: content_id ? Number(content_id) : null },
      });
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
          <p className="text-sm text-muted-foreground">Every entry feeds the team&apos;s shared library. Link it to a script and the technique shows up on that card.</p>
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
        <input className={inputCls} placeholder="Tags — comma separated (AI, Premiere Pro, Hooks…)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        {/* The link that ties learning to real work */}
        <select className={inputCls} value={form.content_id} onChange={(e) => setForm({ ...form, content_id: e.target.value })} title="Apply to a piece of content">
          <option value="">Apply to… (optional)</option>
          {contents.map((c) => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
        </select>

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
        <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">My recent entries</h2><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">{mine.length} logged</span></div>
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
  const [confirmDel, setConfirmDel] = useState(false);
  const hasK2a = e.why_useful || e.project_target || e.do_differently || e.apply_plan;
  return (
    <Card className="lift overflow-hidden" {...(open ? { "data-no-tilt": "" } : {})}>
      <CardContent className="min-w-0 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 break-words font-semibold leading-snug">{e.title}</h3>
          <Badge variant="secondary">{e.resource_type}</Badge>
          {e.worth_sharing && <Badge variant="warning">⭐ Team pick</Badge>}
          {e.team_adopt && <Badge variant="success">Adopt</Badge>}
          {e.content_title && <Badge variant="default" className="gap-1"><Link2 className="h-3 w-3" /> {e.content_title}</Badge>}
          <span className="text-xs text-muted-foreground">{e.entry_date}{showAuthor && e.user_name ? ` · ${e.user_name}` : ""}</span>
          {onDelete && (
            <span className="ml-auto shrink-0">
              {confirmDel ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs text-rose-400">Delete?</span>
                  <button onClick={onDelete} className="text-xs font-semibold text-rose-400 hover:underline">Yes</button>
                  <button onClick={() => setConfirmDel(false)} className="text-xs text-muted-foreground hover:text-foreground">No</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="text-muted-foreground hover:text-rose-400" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </span>
          )}
        </div>
        {e.summary && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/90"><span className="font-medium text-primary">Learned: </span>{e.summary}</p>}
        {e.takeaways && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Takeaways: </span>{e.takeaways}</p>}
        {e.workflow_impact && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Workflow impact: </span>{e.workflow_impact}</p>}
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
              <div className="mt-2 max-h-[60vh] space-y-1 overflow-y-auto overscroll-contain rounded-lg bg-secondary/40 p-4 text-sm [&_p]:whitespace-pre-wrap [&_p]:break-words">
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

/* ── 4) Learning Progress ──────────────────────────────────── */
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
