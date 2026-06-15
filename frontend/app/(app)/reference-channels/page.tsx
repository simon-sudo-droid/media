"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tv, Play, Lightbulb, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACCENT } from "@/lib/accent";

type Channel = {
  id: number; slug: string; name: string; description: string;
  editing_style: string; learn: string[];
  recommended_videos: { title: string; url?: string }[]; accent: string;
  youtube_url?: string;
};

export default function ReferenceChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    api<Channel[]>("/reference-channels", { auth: false }).then(setChannels).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reference Channels</h1>
        <p className="text-muted-foreground">Study the best. Open a channel to read about its style and watch its videos.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {channels.map((c) => (
          <Link key={c.id} href={`/reference-channels/${c.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/40">
              <div className={`h-1.5 w-full bg-gradient-to-r ${ACCENT[c.accent] || ACCENT.violet}`} />
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${ACCENT[c.accent] || ACCENT.violet}`}>
                    <Tv className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editing style</div>
                  <p className="mt-1 text-sm text-foreground/90">{c.editing_style}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5" /> What to learn
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.learn.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Play className="h-3.5 w-3.5 text-primary" /> {c.recommended_videos?.length || 0} videos to watch
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open channel <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
