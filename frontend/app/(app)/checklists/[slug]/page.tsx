"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Loader2, RotateCcw, PartyPopper } from "lucide-react";
import { api } from "@/lib/api";
import { confettiBurst } from "@/lib/confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Item = { id: number; text: string; order_index: number; completed: boolean };
type Detail = {
  id: number; slug: string; title: string; description: string;
  category: string; item_count: number; completed_count: number; items: Item[];
};

export default function ChecklistDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const wasComplete = useRef(false);

  async function load() {
    const d = await api<Detail>(`/checklists/${slug}`);
    setData(d);
    wasComplete.current = d.item_count > 0 && d.completed_count === d.item_count;
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function toggle(item: Item) {
    if (!data) return;
    setBusy(item.id);
    // optimistic update
    const items = data.items.map((it) => it.id === item.id ? { ...it, completed: !it.completed } : it);
    const completed_count = items.filter((it) => it.completed).length;
    setData({ ...data, items, completed_count });
    try {
      await api(`/checklist-items/${item.id}/toggle`, { method: "POST" });
      if (!wasComplete.current && completed_count === data.item_count && data.item_count > 0) {
        confettiBurst();
      }
      wasComplete.current = completed_count === data.item_count;
    } catch {
      load().catch(() => {}); // revert on error
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    if (!data) return;
    setData({ ...data, items: data.items.map((it) => ({ ...it, completed: false })), completed_count: 0 });
    wasComplete.current = false;
    try { await api(`/checklists/${slug}/reset`, { method: "POST" }); } catch { load().catch(() => {}); }
  }

  if (!data) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const pct = data.item_count ? Math.round((data.completed_count / data.item_count) * 100) : 0;
  const allDone = data.item_count > 0 && data.completed_count === data.item_count;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/checklists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Checklists
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-in">
        <div>
          <Badge variant="secondary" className="mb-2">{data.category}</Badge>
          <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
          <p className="text-muted-foreground">{data.description}</p>
        </div>
        <div className="w-full sm:w-56">
          <Progress value={pct} />
          <div className="mt-1.5 text-xs text-muted-foreground">{data.completed_count}/{data.item_count} steps complete</div>
        </div>
      </div>

      {allDone && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 animate-pop">
          <CardContent className="flex items-center gap-3 p-4">
            <PartyPopper className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">All steps done — this deliverable is ready. Nice work! 🎉</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {data.items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => toggle(it)}
              disabled={busy === it.id}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
            >
              {busy === it.id ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
              ) : it.completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 animate-pop" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className={`text-sm ${it.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                <span className="mr-1 text-xs text-muted-foreground">{i + 1}.</span> {it.text}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={reset} disabled={data.completed_count === 0}>
          <RotateCcw className="h-4 w-4" /> Reset checklist
        </Button>
      </div>
    </div>
  );
}
