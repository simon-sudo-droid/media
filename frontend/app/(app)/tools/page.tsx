"use client";

import Link from "next/link";
import { Wand2, ScanSearch, Anchor, Award, BookOpenCheck, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TOOLS = [
  { href: "/tools/broll", icon: ScanSearch, title: "Script → B-roll", desc: "Turn a script into timecoded b-roll placements + multi-source search & generation prompts." },
  { href: "/tools/hook", icon: Anchor, title: "Hook Analyser", desc: "Score your opening on curiosity, clarity, emotion & length — and get the one fix that matters." },
  { href: "/tools/senior-editor", icon: Award, title: "Senior Editor", desc: "Upload script, transcript, Premiere XML & video for a full editor scorecard with issues + fixes." },
  { href: "/tools/storytelling", icon: BookOpenCheck, title: "Storytelling Coach", desc: "Score hook, pacing, emotion, curiosity & CTA, with concrete suggestions." },
  { href: "/tools/slides", icon: ImageIcon, title: "Slide Analyzer", desc: "Upload a slide or picture and get a first-impression test, layout critique & ranked fixes." },
];

export default function ToolsHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="animate-in">
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">AI Tools</h1>
        </div>
        <p className="text-muted-foreground">Everything in one place — pick a tool to get instant, editor-focused feedback.</p>
      </div>

      <div className="grid gap-5 stagger sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="lift h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open tool <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
