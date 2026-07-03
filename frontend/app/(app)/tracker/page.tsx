"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Plus, Loader2, Save, Pencil, Link as LinkIcon, Users, Film, ListChecks } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Entry = {
  id: number; user_id: number; editor_name: string; entry_date: string;
  output_link: string; episode: string; clip_name: string;
  leadership_month: string; leadership_day: string; case_study_reel: string; created_at: string;
};
type Editor = { id: number; name: string };
type Stats = {
  total_entries: number; total_clips: number; distinct_editors: number;
  by_editor: { editor_name: string; clips: number }[];
  by_period: { period: string; clips: number }[];
};

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary";
const EMPTY = { entry_date: "", output_link: "", episode: "", clip_name: "", leadership_month: "", leadership_day: "", case_study_reel: "" };

export default function TrackerPage() {
  const { user } = useAuth();
  const [editors, setEditors] = useState<Editor[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // filters
  const [editorId, setEditorId] = useState<string>("all");
  const [month, setMonth] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupBy, setGroupBy] = useState<"month" | "day">("month");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY });

  // Non-admins default to their own entries.
  useEffect(() => {
    if (user && !user.is_admin) setEditorId(String(user.id));
  }, [user]);

  const qs = useCallback((extra?: Record<string, string>) => {
    const p = new URLSearchParams();
    if (editorId !== "all") p.set("editor_id", editorId);
    if (month) p.set("month", month);
    if (from) p.set("date_from", from);
    if (to) p.set("date_to", to);
    Object.entries(extra || {}).forEach(([k, v]) => p.set(k, v));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [editorId, month, from, to]);

  const reload = useCallback(() => {
    api<Entry[]>(`/tracker${qs()}`).then(setEntries).catch(() => {});
    api<Stats>(`/tracker/stats${qs({ group_by: groupBy })}`).then(setStats).catch(() => {});
  }, [qs, groupBy]);

  useEffect(() => { api<Editor[]>("/tracker/editors").then(setEditors).catch(() => {}); }, []);
  useEffect(reload, [reload]);
  // Live: refresh entries + chart periodically so team output updates in real time.
  useEffect(() => {
    const id = setInterval(reload, 20000);
    return () => clearInterval(id);
  }, [reload]);

  async function save() {
    if (!form.entry_date) return;
    setSaving(true);
    try {
      await api("/tracker", { method: "POST", body: form });
      setForm({ ...EMPTY }); setShowForm(false);
      api<Editor[]>("/tracker/editors").then(setEditors).catch(() => {});
      reload();
    } finally { setSaving(false); }
  }

  function startEdit(e: Entry) {
    setEditId(e.id);
    setEditForm({
      entry_date: e.entry_date, output_link: e.output_link, episode: e.episode,
      clip_name: e.clip_name, leadership_month: e.leadership_month,
      leadership_day: e.leadership_day, case_study_reel: e.case_study_reel,
    });
  }
  async function saveEdit(id: number) {
    setSaving(true);
    try {
      await api(`/tracker/${id}`, { method: "PATCH", body: editForm });
      setEditId(null); reload();
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Tracker Analytics</h1>
          </div>
          <p className="text-muted-foreground">Log your daily output. Entries save under your name and lock after saving.</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm((v) => !v)} className="gap-1.5"><Plus className="h-4 w-4" /> New entry</Button>
      </div>

      {/* Entry form */}
      {showForm && (
        <Card className="animate-in">
          <CardContent className="space-y-3 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><input type="date" className={inputCls} value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></Field>
              <Field label="Output link"><input className={inputCls} placeholder="https://…" value={form.output_link} onChange={(e) => setForm({ ...form, output_link: e.target.value })} /></Field>
              <Field label="Episode"><input className={inputCls} placeholder="Episode 9" value={form.episode} onChange={(e) => setForm({ ...form, episode: e.target.value })} /></Field>
              <Field label="Clip name"><input className={inputCls} placeholder="Renamed clip" value={form.clip_name} onChange={(e) => setForm({ ...form, clip_name: e.target.value })} /></Field>
              <Field label="Leadership month"><input className={inputCls} placeholder="e.g. June" value={form.leadership_month} onChange={(e) => setForm({ ...form, leadership_month: e.target.value })} /></Field>
              <Field label="Day of month"><input className={inputCls} placeholder="e.g. 12" value={form.leadership_day} onChange={(e) => setForm({ ...form, leadership_day: e.target.value })} /></Field>
              <Field label="Case study reel"><input className={inputCls} placeholder="Case study name" value={form.case_study_reel} onChange={(e) => setForm({ ...form, case_study_reel: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="gradient" size="sm" disabled={saving || !form.entry_date} onClick={save}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Editor">
            <select className={inputCls} value={editorId} onChange={(e) => setEditorId(e.target.value)}>
              <option value="all">All editors</option>
              {editors.map((ed) => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
            </select>
          </Field>
          <Field label="Month"><input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
          <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </CardContent>
      </Card>

      {/* Summary strip */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={ListChecks} label="Entries" value={stats.total_entries} />
          <Stat icon={Film} label="Clips submitted" value={stats.total_clips} />
          <Stat icon={Users} label="Editors" value={stats.distinct_editors} />
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-3">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-5">
              {editId === e.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="date" className={inputCls} value={editForm.entry_date} onChange={(ev) => setEditForm({ ...editForm, entry_date: ev.target.value })} />
                    <input className={inputCls} placeholder="Output link" value={editForm.output_link} onChange={(ev) => setEditForm({ ...editForm, output_link: ev.target.value })} />
                    <input className={inputCls} placeholder="Episode" value={editForm.episode} onChange={(ev) => setEditForm({ ...editForm, episode: ev.target.value })} />
                    <input className={inputCls} placeholder="Clip name" value={editForm.clip_name} onChange={(ev) => setEditForm({ ...editForm, clip_name: ev.target.value })} />
                    <input className={inputCls} placeholder="Leadership month" value={editForm.leadership_month} onChange={(ev) => setEditForm({ ...editForm, leadership_month: ev.target.value })} />
                    <input className={inputCls} placeholder="Day" value={editForm.leadership_day} onChange={(ev) => setEditForm({ ...editForm, leadership_day: ev.target.value })} />
                    <input className={inputCls} placeholder="Case study reel" value={editForm.case_study_reel} onChange={(ev) => setEditForm({ ...editForm, case_study_reel: ev.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                    <Button variant="gradient" size="sm" disabled={saving} onClick={() => saveEdit(e.id)}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">{e.editor_name}</Badge>
                      <span className="text-sm font-medium">{e.entry_date}</span>
                      {e.episode && <Badge variant="secondary">{e.episode}</Badge>}
                    </div>
                    <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                      {e.clip_name && <span><span className="text-foreground/80">Clip:</span> {e.clip_name}</span>}
                      {(e.leadership_month || e.leadership_day) && <span><span className="text-foreground/80">Leadership:</span> {e.leadership_month} {e.leadership_day}</span>}
                      {e.case_study_reel && <span><span className="text-foreground/80">Case study:</span> {e.case_study_reel}</span>}
                      {e.output_link && <a href={e.output_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><LinkIcon className="h-3.5 w-3.5" /> Output link</a>}
                    </div>
                  </div>
                  {user?.is_admin && (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(e)} className="shrink-0 gap-1"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No entries for these filters yet.</p>}
      </div>

      {/* Analytics */}
      {stats && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Data Analytics</h2>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardContent className="p-5">
              <div className="mb-4 text-sm font-semibold">Clips by editor</div>
              <BarChart data={stats.by_editor.map((b) => ({ label: b.editor_name, value: b.clips }))} yLabel="Clips submitted" xLabel="Editor" />
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Clips over time</div>
                <div className="flex gap-1">
                  {(["month", "day"] as const).map((g) => (
                    <button key={g} onClick={() => setGroupBy(g)} className={`rounded-md px-2 py-1 text-xs ${groupBy === g ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{g === "month" ? "By month" : "By day"}</button>
                  ))}
                </div>
              </div>
              <BarChart data={stats.by_period.map((p) => ({ label: p.period.slice(5), value: p.clips }))} yLabel="Clips" xLabel={groupBy === "month" ? "Month" : "Day"} />
            </CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}

const CHART_PALETTE = ["#a855f7", "#ec4899", "#ef4444", "#0ea5e9", "#22c55e", "#f59e0b", "#14b8a6", "#8b5cf6"];

function BarChart({ data, yLabel, xLabel }: { data: { label: string; value: number }[]; yLabel: string; xLabel: string }) {
  const H = 200;
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No data yet — add tracker entries to populate this chart.</p>;
  const rawMax = Math.max(1, ...data.map((d) => d.value));
  const step = rawMax <= 5 ? 1 : rawMax <= 10 ? 2 : rawMax <= 20 ? 4 : Math.ceil(rawMax / 5 / 5) * 5;
  const niceMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax; v += step) ticks.push(v);

  return (
    <div className="flex gap-2">
      <div className="grid place-items-center">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl] rotate-180">{yLabel}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex">
          {/* y-axis ticks */}
          <div className="relative mr-2 w-6" style={{ height: H }}>
            {ticks.map((v) => (
              <span key={v} className="absolute right-0 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ bottom: `${(v / niceMax) * H}px` }}>{v}</span>
            ))}
          </div>
          {/* plot */}
          <div className="relative flex-1" style={{ height: H }}>
            {ticks.map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-border/50" style={{ bottom: `${(v / niceMax) * H}px` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-2 px-1">
              {data.map((d, i) => (
                <div key={d.label} className="flex flex-1 flex-col items-center justify-end">
                  <span className="mb-0.5 text-[10px] font-semibold">{d.value}</span>
                  <div className="w-full max-w-[46px] rounded-t transition-all" style={{ height: `${(d.value / niceMax) * H}px`, backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} title={`${d.label}: ${d.value}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* x labels */}
        <div className="mt-1.5 flex">
          <div className="mr-2 w-6" />
          <div className="flex flex-1 gap-2 px-1">
            {data.map((d) => (
              <div key={d.label} className="flex-1 truncate text-center text-[11px] text-muted-foreground" title={d.label}>{d.label}</div>
            ))}
          </div>
        </div>
        <div className="mt-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">{xLabel}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
