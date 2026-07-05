"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Flame, Trophy, GraduationCap, ListChecks, Zap, ArrowRight, Activity, Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSplash } from "@/components/dashboard-splash";
import { Tilt } from "@/components/tilt";

// WebGL/GSAP bundle loads only on the client, only for this page.
const CinematicIntro = dynamic(() => import("@/components/cinematic/cinematic-intro"), {
  ssr: false,
  loading: () => <div className="h-screen bg-[#050508]" />,
});

type Dashboard = {
  user: { full_name: string; xp: number; level: string; streak_days: number };
  xp_to_next_level: number;
  next_level: string;
  level_progress_pct: number;
  courses_completed: number;
  courses_total: number;
  quizzes_taken: number;
  challenges_completed: number;
  daily_challenge: { id: number; title: string; description: string; xp_reward: number; completed: boolean } | null;
  recent_activity: { kind: string; description: string; xp: number; created_at: string }[];
};

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>("/dashboard").then(setData).catch(() => {});
  }, []);

  const firstName = (user?.full_name || "Editor").split(" ")[0];

  return (
    <>
      {/* ── Cinematic scroll-driven 3D intro (replaces the hero only) ── */}
      <div className="no-reveal -mx-5 -mt-5 md:-mx-8 md:-mt-8">
        <CinematicIntro name={firstName} />
      </div>

      <div id="dashboard-content" className="mx-auto max-w-6xl scroll-mt-20 space-y-7 pt-8">
      <DashboardSplash />

      {/* Stat cards */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Total XP" value={data?.user.xp.toLocaleString() ?? "—"} accent="text-primary" />
        <StatCard icon={Trophy} label="Skill Level" value={data?.user.level ?? "—"} accent="text-amber-400" />
        <StatCard icon={Flame} label="Day Streak" value={data ? `${data.user.streak_days}` : "—"} accent="text-orange-400" />
        <StatCard icon={GraduationCap} label="Courses Done" value={data ? `${data.courses_completed}/${data.courses_total}` : "—"} accent="text-emerald-400" />
      </div>

      {/* Level progress */}
      <Tilt max={3} scale={1.005} className="rounded-xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Level Progress</CardTitle>
            {data && <Badge variant="outline">Next: {data.next_level}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={data?.level_progress_pct ?? 0} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data?.user.level}</span>
            <span>{data ? `${data.xp_to_next_level.toLocaleString()} XP to ${data.next_level}` : ""}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {LEVELS.map((lvl) => (
              <Badge key={lvl} variant={data?.user.level === lvl ? "default" : "secondary"}>{lvl}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      </Tilt>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Daily challenge */}
        <Tilt max={6} className="rounded-xl">
        <Card className="h-full border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /> Daily Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.daily_challenge ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{data.daily_challenge.title}</h3>
                    {data.daily_challenge.completed && <Badge variant="success">Done</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{data.daily_challenge.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="gap-1"><Zap className="h-3 w-3" /> +{data.daily_challenge.xp_reward} XP</Badge>
                  <Link href="/challenges">
                    <Button size="sm" variant="gradient">{data.daily_challenge.completed ? "More challenges" : "Take challenge"} <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No challenge available.</p>
            )}
          </CardContent>
        </Card>
        </Tilt>

        {/* Quick stats */}
        <Tilt max={6} className="rounded-xl">
        <Card className="h-full">
          <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Your Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Quizzes taken" value={data?.quizzes_taken ?? 0} />
            <Row label="Challenges completed" value={data?.challenges_completed ?? 0} />
            <Row label="Courses completed" value={data ? `${data.courses_completed} / ${data.courses_total}` : "—"} />
            <div className="flex gap-2 pt-2">
              <Link href="/quizzes" className="flex-1"><Button variant="outline" size="sm" className="w-full">Take a quiz</Button></Link>
              <Link href="/academy" className="flex-1"><Button variant="outline" size="sm" className="w-full">Continue learning</Button></Link>
            </div>
          </CardContent>
        </Card>
        </Tilt>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {data && data.recent_activity.length > 0 ? (
            <div className="divide-y divide-border">
              {data.recent_activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs uppercase">{a.kind[0]}</div>
                    <span className="text-sm">{a.description}</span>
                  </div>
                  {a.xp > 0 && <Badge variant="success">+{a.xp} XP</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet — complete a lesson or challenge to get started!
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <Tilt max={10} className="h-full rounded-xl">
      <Card className="h-full">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`grid h-11 w-11 place-items-center rounded-lg bg-secondary ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        </CardContent>
      </Card>
    </Tilt>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
