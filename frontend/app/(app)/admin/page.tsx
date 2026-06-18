"use client";

import { useEffect, useState } from "react";
import { Shield, Users, Activity, Radar, Loader2, Lock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  id: number; email: string; full_name: string; xp: number; level: string;
  streak_days: number; is_admin: boolean; created_at: string;
  logins: number; actions: number; last_active: string | null;
};
type Act = { email: string; full_name: string; kind: string; description: string; xp: number; created_at: string };
type Intel = {
  digest: { status: string; updated: string; items: { title: string; summary: string; category: string; source?: string }[] };
  sections: Record<string, string[]>;
  sources: Record<string, Record<string, string[]>>;
};

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");
const TABS = [
  { key: "users", label: "Users", icon: Users },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "intel", label: "Creative Intelligence", icon: Radar },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setBusy(true);
    try {
      const [u, a, i] = await Promise.all([
        api<AdminUser[]>("/admin/users").catch(() => []),
        api<Act[]>("/admin/activity").catch(() => []),
        api<Intel>("/admin/intel").catch(() => null),
      ]);
      setUsers(u); setActs(a); setIntel(i);
    } finally { setBusy(false); }
  }

  useEffect(() => { if (user?.is_admin) loadAll(); }, [user]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!user?.is_admin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-bold">Admin only</h1>
        <p className="text-muted-foreground">This area is restricted to the administrator account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        </div>
        <button onClick={loadAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary/60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th><th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">XP</th><th className="px-4 py-3">Logins</th>
                  <th className="px-4 py-3">Actions</th><th className="px-4 py-3">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name || u.email.split("@")[0]} {u.is_admin && <Badge variant="default" className="ml-1">admin</Badge>}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{u.level}</td>
                    <td className="px-4 py-3">{u.xp.toLocaleString()}</td>
                    <td className="px-4 py-3">{u.logins}</td>
                    <td className="px-4 py-3">{u.actions}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(u.last_active)}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users yet.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {acts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm"><span className="font-medium">{a.full_name || a.email.split("@")[0]}</span> <span className="text-muted-foreground">· {a.description}</span></div>
                  <div className="text-xs text-muted-foreground">{a.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{a.kind}</Badge>
                  <span className="hidden text-xs text-muted-foreground sm:block">{fmt(a.created_at)}</span>
                </div>
              </div>
            ))}
            {acts.length === 0 && <div className="px-4 py-8 text-center text-muted-foreground">No activity yet.</div>}
          </CardContent>
        </Card>
      )}

      {tab === "intel" && intel && (
        <div className="space-y-5">
          {/* Daily digest */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Radar className="h-4 w-4 text-primary" />
                <span className="font-semibold">Daily digest</span>
                <Badge variant={intel.digest.status === "live" ? "success" : "secondary"}>
                  {intel.digest.status === "live" ? `Live · ${intel.digest.updated}` : "Live feed off"}
                </Badge>
              </div>
              {intel.digest.items.length > 0 ? (
                <div className="space-y-3">
                  {intel.digest.items.map((it, i) => (
                    <div key={i} className="rounded-lg bg-secondary/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{it.title}</span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{it.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{it.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Live daily updates activate automatically once the Gemini key has quota (Google-Search-grounded,
                  refreshed daily, filtered to the last 3 days). Until then, use the curated sources below.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dashboard sections */}
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(intel.sections).map(([name, items]) => (
              <Card key={name}><CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold">{name}</div>
                <div className="flex flex-wrap gap-2">{items.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div>
              </CardContent></Card>
            ))}
          </div>

          {/* Curated source hub */}
          <Card><CardContent className="p-6">
            <div className="mb-3 font-semibold">Where to watch (curated sources)</div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(intel.sources).map(([group, sub]) => (
                <div key={group} className="rounded-lg bg-secondary/30 p-4">
                  <div className="mb-2 text-sm font-semibold">{group}</div>
                  {Object.entries(sub).map(([k, vals]) => (
                    <div key={k} className="mb-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">{vals.map((v) => <span key={v} className="rounded-md bg-background/60 px-2 py-0.5 text-xs">{v}</span>)}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
