"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles, LayoutDashboard, GraduationCap, Tv, Trophy, LogOut, Menu, X, Flame as FlameIcon,
  ListTodo, BadgeCheck, Wrench, Shield, BarChart3, LifeBuoy, Wand2, Sun, Moon, Monitor,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme, type Theme } from "@/lib/theme";
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
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold">EditMentor<span className="text-gradient"> AI</span></span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
        {user.is_admin && (
          <>
            <div className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </div>
            <NavLink href="/admin" label="Admin" icon={Shield} active={pathname === "/admin"} />
            <NavLink href="/leaderboard" label="Leaderboard" icon={Trophy} active={pathname === "/leaderboard"} />
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
          <Button variant="ghost" size="icon" onClick={logout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-gradient-to-b from-card/70 to-card/20 backdrop-blur-xl md:block">
        {SidebarInner}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
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
      {opts.map((o) => (
        <button
          key={o.value}
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

function NavLink({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: any; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}
