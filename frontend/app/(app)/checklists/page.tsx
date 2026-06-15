"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Checklist = {
  id: number; slug: string; title: string; description: string;
  category: string; icon: string; item_count: number; completed_count: number;
};

export default function ChecklistsPage() {
  const [lists, setLists] = useState<Checklist[]>([]);

  useEffect(() => {
    api<Checklist[]>("/checklists").then(setLists).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="animate-in">
        <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
        <p className="text-muted-foreground">Production workflows — tick off each step and track your progress.</p>
      </div>

      <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((c) => {
          const Icon = (Icons as any)[c.icon] || Icons.ListChecks;
          const pct = c.item_count ? Math.round((c.completed_count / c.item_count) * 100) : 0;
          const done = c.item_count > 0 && c.completed_count === c.item_count;
          return (
            <Link key={c.id} href={`/checklists/${c.slug}`}>
              <Card className="lift h-full">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`grid h-11 w-11 place-items-center rounded-lg ${done ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{c.category}</Badge>
                  </div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4 space-y-2">
                    <Progress value={pct} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{c.completed_count}/{c.item_count} done</span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
