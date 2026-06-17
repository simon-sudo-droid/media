"use client";

import { useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { ANNOUNCEMENTS, unreadCount, markAllSeen } from "@/lib/whats-new";
import { notificationsEnabled } from "@/components/settings-dialog";
import { Badge } from "@/components/ui/badge";

const TAG_VARIANT: Record<string, "default" | "success" | "secondary" | "warning"> = {
  Quizzes: "default", Feature: "success", Content: "secondary", Fix: "warning",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [enabled, setEnabled] = useState(true);

  function refresh() { setUnread(unreadCount()); setEnabled(notificationsEnabled()); }

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("em-notify-change", onChange);
    return () => window.removeEventListener("em-notify-change", onChange);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) { markAllSeen(); setUnread(0); }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="What's new"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {enabled && unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-pop">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold">What&rsquo;s new</span>
            </div>
            <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
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
        </>
      )}
    </div>
  );
}
