"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles, LayoutDashboard, GraduationCap, Tv, Trophy, LogOut, Menu, X, Flame as FlameIcon,
  ListTodo, BadgeCheck, Wrench, Shield, BarChart3, LifeBuoy, Wand2, Sun, Moon, Monitor,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme, type Theme } from "@/lib/theme";
import { blip } from "@/lib/sfx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsBell } from "@/components/notifications-bell";
import { AccountMenu } from "@/components/account-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academy", label: "Learning Hub", icon: GraduationCap },
  { href: "/tools", label: "AI Tools", icon: Wand2 },
  { href: "/reference-channels", label: "Reference Channels", icon: Tv },
  { href: "/approved-videos", label: "Approved Videos", icon: BadgeCheck },
  { href: "/checklists", label: "Checklists", icon: ListTodo },
  { href: "/tracker", label: "Tracker Analytics", icon: BarChart3 },
  { href: "/it-issues", label: "IT Technical Issues", icon: Wrench },
  { href: "/guide", label: "Guide & Help", icon: LifeBuoy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" /> Loading…
        </div>
      </div>
    );
  }

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-800">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">EditMentor<span className="text-gradient"> AI</span></span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close menu">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
        {NAV.map((item, i) => (
          <NavLink key={item.href} {...item} index={i} active={pathname === item.href} />
        ))}
        {user.is_admin && (
          <>
            <div className="px-3 pb-2 pt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Admin
            </div>
            <NavLink href="/admin" label="Admin" icon={Shield} index={NAV.length} active={pathname === "/admin"} />
            <NavLink href="/leaderboard" label="Leaderboard" icon={Trophy} index={NAV.length + 1} active={pathname === "/leaderboard"} />
          </>
        )}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <ThemeSwitcher />
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.full_name || user.email}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
          <Button variant="ghost" size="icon" onMouseEnter={() => blip(8)} onClick={logout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar drawer — hidden until the ☰ button opens it (all screen sizes) */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="animate-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="animate-slide-in absolute left-0 top-0 h-full w-80 border-r border-border bg-card/95 shadow-2xl backdrop-blur-xl">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/60 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { blip(0); setOpen(true); }} title="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="hidden items-center gap-2 sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-800">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">EditMentor<span className="text-gradient"> AI</span></span>
            </Link>
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> {user.level}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1.5 px-3 py-1 text-sm">
              {user.xp.toLocaleString()} XP
            </Badge>
            <NotificationsBell />
            <AccountMenu />
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const opts: { value: Theme; label: string; icon: any }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary/40 p-1">
      {opts.map((o, i) => (
        <button
          key={o.value}
          onMouseEnter={() => blip(i + 3)}
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
            theme === o.value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
          title={o.label}
        >
          <o.icon className="h-4 w-4" /> {o.label}
        </button>
      ))}
    </div>
  );
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&@$+*!?";

function NavLink({
  href, label, icon: Icon, active, index = 0,
}: {
  href: string; label: string; icon: any; active: boolean; index?: number;
}) {
  // Decode effect: characters randomize, then lock in left-to-right.
  const [display, setDisplay] = useState(label);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  function scramble() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      frame++;
      const locked = Math.floor(frame / 2); // one letter locks in every 2 ticks
      if (locked >= label.length) {
        if (timer.current) clearInterval(timer.current);
        setDisplay(label);
        return;
      }
      let out = "";
      for (let i = 0; i < label.length; i++) {
        out += i < locked || label[i] === " "
          ? label[i]
          : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setDisplay(out);
    }, 28);
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => { blip(index); scramble(); }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-bold tracking-tight transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" /> <span className="whitespace-pre">{display}</span>
    </Link>
  );
}
