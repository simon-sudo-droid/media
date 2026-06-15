"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Tv, Youtube, Play, Lightbulb, Clapperboard, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCENT } from "@/lib/accent";

type Channel = {
  id: number; slug: string; name: string; description: string;
  editing_style: string; learn: string[];
  recommended_videos: { title: string; url?: string }[]; accent: string;
  youtube_url?: string;
};

export default function ChannelDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [c, setC] = useState<Channel | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<Channel>(`/reference-channels/${slug}`, { auth: false })
      .then(setC)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-muted-foreground">
        Channel not found.{" "}
        <Link href="/reference-channels" className="text-primary underline">Back to channels</Link>
      </div>
    );
  }

  if (!c) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const accent = ACCENT[c.accent] || ACCENT.violet;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link href="/reference-channels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Reference Channels
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className={`h-2 w-full bg-gradient-to-r ${accent}`} />
        <CardContent className="p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent}`}>
                <Tv className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
                <p className="mt-1 max-w-2xl text-muted-foreground">{c.description}</p>
              </div>
            </div>
            {c.youtube_url && (
              <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button variant="gradient" className="gap-2">
                  <Youtube className="h-4 w-4" /> Visit official YouTube
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold"><Clapperboard className="h-4 w-4 text-primary" /> Editing style</div>
            <p className="text-sm text-foreground/90">{c.editing_style}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-primary" /> What to learn here</div>
            <div className="flex flex-wrap gap-2">
              {c.learn.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watch & learn */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Watch & learn</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.recommended_videos?.map((v, i) => (
            <a
              key={i}
              href={v.url || c.youtube_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className={`grid h-24 w-full place-items-center rounded-lg bg-gradient-to-br ${accent} opacity-90`}>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-black/30 backdrop-blur transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{v.title}</span>
                    <Youtube className="h-4 w-4 shrink-0 text-red-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Watch on YouTube →</span>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Videos open on {c.name}&rsquo;s official YouTube. Study the cuts, pacing, and choices — then practice them in the Academy.
        </p>
      </div>
    </div>
  );
}
