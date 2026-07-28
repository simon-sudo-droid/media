"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Sparkles, MessageSquare, AtSign, ArrowRightLeft, Pencil, UserPlus } from "lucide-react";
import { ANNOUNCEMENTS, unreadCount, markAllSeen } from "@/lib/whats-new";
import { notificationsEnabled } from "@/components/settings-dialog";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const TAG_VARIANT: Record<string, "default" | "success" | "secondary" | "warning"> = {
  Quizzes: "default", Feature: "success", Content: "secondary", Fix: "warning",
};

// Server-side notifications (workspace activity) shown above "What's new".
type Note = { id: number; kind: string; title: string; body: string; content_id: number | null; read: boolean; at: string };
const KIND_ICON: Record<string, any> = {
  comment: MessageSquare, mention: AtSign, status: ArrowRightLeft, edit: Pencil, assign: UserPlus,
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [serverUnread, setServerUnread] = useState(0);

  const pull = useCallback(async () => {
    try {
      const r = await api<{ unread: number; items: Note[] }>("/notifications");
      setNotes(r.items);
      setServerUnread(r.unread);
    } catch { /* not signed in yet, or offline */ }
  }, []);

  function refresh() { setUnread(unreadCount()); setEnabled(notificationsEnabled()); }

  useEffect(() => {
    refresh();
    pull();
    const onChange = () => refresh();
    window.addEventListener("em-notify-change", onChange);
    // Light polling so status changes/comments surface without a reload.
    const iv = setInterval(pull, 60000);
    return () => { window.removeEventListener("em-notify-change", onChange); clearInterval(iv); };
  }, [pull]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      markAllSeen();
      setUnread(0);
      if (serverUnread > 0) {
        api("/notifications/read-all", { method: "POST" }).catch(() => {});
        setServerUnread(0);
        setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
  }
  const total = unread + serverUnread;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="What's new"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {enabled && total > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-pop">
            {total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in">
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Workspace activity */}
              {notes.length > 0 && (
                <>
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Activity</span>
                    {serverUnread > 0 && <Badge variant="default" className="text-[10px]">{serverUnread} new</Badge>}
                  </div>
                  <div className="divide-y divide-border">
                    {notes.slice(0, 12).map((n) => {
                      const Icon = KIND_ICON[n.kind] || Bell;
                      const inner = (
                        <div className={`px-4 py-3 ${n.read ? "" : "bg-primary/5"}`}>
                          <div className="flex items-start gap-2">
                            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium">{n.title}</p>
                              {n.body && <p className="mt-0.5 break-words text-xs text-muted-foreground">{n.body}</p>}
                              <p className="mt-1 text-[10px] text-muted-foreground/70">{n.at.replace("T", " ").slice(0, 16)}</p>
                            </div>
                          </div>
                        </div>
                      );
                      return n.content_id ? (
                        <Link key={n.id} href="/workspace" onClick={() => setOpen(false)} className="block hover:bg-secondary/40">{inner}</Link>
                      ) : <div key={n.id}>{inner}</div>;
                    })}
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 border-b border-t border-border px-4 py-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold">What&rsquo;s new</span>
              </div>
              <div className="divide-y divide-border">
              {ANNOUNCEMENTS.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{a.title}</span>
                    <Badge variant={TAG_VARIANT[a.tag] || "secondary"} className="shrink-0 text-[10px]">{a.tag}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{a.date}</p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
