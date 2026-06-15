"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Course = {
  id: number; slug: string; title: string; description: string;
  level: string; category: string; icon: string;
  lesson_count: number; completed_count: number;
};

const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "policy"];
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
  policy: "Company Policy",
};

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api<Course[]>("/courses").then(setCourses).catch(() => {});
  }, []);

  const grouped = LEVEL_ORDER.map((lvl) => ({
    level: lvl,
    items: courses.filter((c) => c.level === lvl),
  })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Academy</h1>
        <p className="text-muted-foreground">Structured courses from foundations to cinematic mastery.</p>
      </div>

      {grouped.map((group) => (
        <section key={group.level} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{LEVEL_LABEL[group.level]}</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((c) => {
              const Icon = (Icons as any)[c.icon] || Icons.GraduationCap;
              const pct = c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
              return (
                <Link key={c.id} href={`/academy/${c.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary">{LEVEL_LABEL[c.level]}</Badge>
                      </div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                      <div className="mt-4 space-y-2">
                        <Progress value={pct} />
                        <div className="text-xs text-muted-foreground">
                          {c.completed_count}/{c.lesson_count} lessons
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
