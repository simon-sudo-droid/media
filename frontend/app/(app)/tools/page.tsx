"use client";

import Link from "next/link";
import { Wand2, ScanSearch, Anchor, Award, BookOpenCheck, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/page-hero";

const TILES = [
  { icon: ScanSearch, x: "left-[9%]", y: "top-[28%]", d: "0s" },
  { icon: Anchor, x: "left-[16%]", y: "top-[66%]", d: "0.9s" },
  { icon: Award, x: "right-[10%]", y: "top-[26%]", d: "0.5s" },
  { icon: BookOpenCheck, x: "right-[17%]", y: "top-[66%]", d: "1.3s" },
];

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
      <PageHero
        eyebrow="AI Tools"
        icon={Wand2}
        title={<>Your AI editing <span className="text-gradient">toolkit</span></>}
        subtitle="Everything in one place — pick a tool to get instant, editor-focused feedback."
        tiles={TILES}
      />

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
