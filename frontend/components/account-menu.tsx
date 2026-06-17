"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Settings, LifeBuoy, LogOut, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SettingsDialog } from "@/components/settings-dialog";

function initials(name: string, email: string): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function AccountMenu() {
  const { user, logout, switchAccount } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!user) return null;

  const name = user.full_name || user.email.split("@")[0];

  function go(fn: () => void) { setOpen(false); fn(); }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-sm font-bold text-white transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        {initials(user.full_name, user.email)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-sm font-bold text-white">
                {initials(user.full_name, user.email)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="text-xs text-muted-foreground">Free</div>
              </div>
            </div>

            <div className="py-1">
              <Item icon={UserIcon} label="Profile" onClick={() => go(() => router.push("/dashboard"))} />
              <Item icon={Settings} label="Settings" onClick={() => go(() => setSettingsOpen(true))} />
              <Item icon={LifeBuoy} label="Help" chevron onClick={() => go(() => router.push("/it-issues"))} />
            </div>

            <div className="border-t border-border py-1">
              <Item icon={Users} label="Switch account" chevron onClick={() => go(switchAccount)} />
              <Item icon={LogOut} label="Log out" chevron onClick={() => go(logout)} />
            </div>
          </div>
        </>
      )}

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Item({ icon: Icon, label, onClick, chevron }: { icon: any; label: string; onClick: () => void; chevron?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
