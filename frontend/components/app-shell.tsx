"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles, LayoutDashboard, GraduationCap, Tv, ListChecks, Flame,
  ScanSearch, BookOpenCheck, Image as ImageIcon, Trophy, LogOut, Menu, X, Flame as FlameIcon,
  ListTodo, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academy", label: "Learning Academy", icon: GraduationCap },
  { href: "/reference-channels", label: "Reference Channels", icon: Tv },
  { href: "/approved-videos", label: "Approved Videos", icon: BadgeCheck },
  { href: "/checklists", label: "Checklists", icon: ListTodo },
  { href: "/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/challenges", label: "Challenges", icon: Flame },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const TOOLS = [
  { href: "/tools/broll", label: "Script → B-roll", icon: ScanSearch },
  { href: "/tools/storytelling", label: "Storytelling Coach", icon: BookOpenCheck },
  { href: "/tools/slides", label: "Slide Analyzer", icon: ImageIcon },
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

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
        <div className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Tools
        </div>
        {TOOLS.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.full_name || user.email}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FlameIcon className="h-3 w-3 text-orange-400" /> {user.streak_days} day streak
            </div>
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
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-card/40 md:block">
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
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
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
