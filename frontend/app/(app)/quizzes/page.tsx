"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Quiz = {
  id: number; slug: string; title: string; topic: string;
  level: string; description: string; question_count: number;
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    api<Quiz[]>("/quizzes").then(setQuizzes).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="animate-in">
        <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">Test your knowledge and earn XP — 25 XP per correct answer. Bragging rights sold separately. 🧠</p>
      </div>

      <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((q) => (
          <Link key={q.id} href={`/quizzes/${q.slug}`}>
            <Card className="lift h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="capitalize">{q.level}</Badge>
                </div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{q.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{q.question_count} questions</span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">Start <ArrowRight className="h-4 w-4" /></span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
