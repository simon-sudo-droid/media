"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Zap, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { confettiBurst } from "@/lib/confetti";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Lesson = {
  id: number; title: string; summary: string; content: string;
  order_index: number; xp_reward: number; completed: boolean;
};
type CourseDetail = {
  id: number; slug: string; title: string; description: string; level: string;
  lesson_count: number; completed_count: number; lessons: Lesson[];
};

function LessonText({ text }: { text: string }) {
  // Render plain text but turn any URLs into clickable links.
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { refresh } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [active, setActive] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<CourseDetail>(`/courses/${slug}`);
    setCourse(data);
    setActive((prev) => data.lessons.find((l) => l.id === prev?.id) || data.lessons[0] || null);
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function complete(lesson: Lesson) {
    setBusy(true);
    try {
      const res = await api<{ already_completed: boolean }>(`/lessons/${lesson.id}/complete`, { method: "POST" });
      if (!res.already_completed) confettiBurst();
      await load();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!course) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const pct = course.lesson_count ? Math.round((course.completed_count / course.lesson_count) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/academy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Academy
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-2 capitalize">{course.level}</Badge>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        <div className="w-full sm:w-56">
          <Progress value={pct} />
          <div className="mt-1.5 text-xs text-muted-foreground">{course.completed_count}/{course.lesson_count} lessons complete</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Lesson list */}
        <Card className="h-fit">
          <CardContent className="space-y-1 p-3">
            {course.lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setActive(l)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active?.id === l.id ? "bg-primary/15 text-primary" : "hover:bg-secondary/60"}`}
              >
                {l.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className="flex-1">{i + 1}. {l.title}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Lesson content */}
        {active && (
          <Card>
            <CardContent className="space-y-5 p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{active.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{active.summary}</p>
                </div>
                <Badge variant="default" className="gap-1 shrink-0"><Zap className="h-3 w-3" /> +{active.xp_reward} XP</Badge>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                <LessonText text={active.content} />
              </p>
              <div className="pt-2">
                {active.completed ? (
                  <Badge variant="success" className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Completed</Badge>
                ) : (
                  <Button variant="gradient" disabled={busy} onClick={() => complete(active)}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Mark complete & earn XP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
