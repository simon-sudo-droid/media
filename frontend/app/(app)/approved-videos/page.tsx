"use client";

import { useState } from "react";
import { BadgeCheck, Play, ExternalLink, Youtube } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ApprovedVideo = {
  id: string;        // YouTube video id
  title: string;
  kind: string;      // "Podcast clip" | "Short"
  tags: string[];
};

const CHANNEL_URL = "https://www.youtube.com/@ataandeadvisors";

// Most-recent uploads from the Ataande & Advisors channel (pulled from the
// channel feed). Swap the ids/titles here to feature different videos.
const VIDEOS: ApprovedVideo[] = [
  { id: "LPQNGw_-RJI", title: "Building a Billion-Dollar Company to Solve Africa's Biggest Problems", kind: "Podcast clip", tags: ["Pacing", "Story arc", "Captions"] },
  { id: "atCvUDM7FVc", title: "What Is an Angel Investor? The Honest Explanation Nobody Is Giving", kind: "Podcast clip", tags: ["Hook", "B-roll variety", "Subtitles"] },
  { id: "aFWRxFKd458", title: "Don't Quit Your Day Job: Advice Nobody on Social Media Is Giving", kind: "Short", tags: ["Punchy cuts", "Vertical", "Retention"] },
  { id: "9qY3d9gAUpo", title: "The Financial Skills Nobody Taught Us — And Why That Has to Change", kind: "Short", tags: ["Hook", "Captions", "Energy"] },
];

export default function ApprovedVideosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="animate-in">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight">Approved Videos</h1>
          <Badge variant="secondary" className="gap-1"><Youtube className="h-3 w-3 text-red-500" /> Ataande &amp; Advisors</Badge>
        </div>
        <p className="text-muted-foreground">
          The gold standard. Watch the latest approved edits right here — steal the pacing, captions, and shot
          choices. (No notes app required; just vibes and good cuts.)
        </p>
        <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
          <Button variant="outline" size="sm" className="gap-1.5"><Youtube className="h-3.5 w-3.5 text-red-500" /> Visit the channel</Button>
        </a>
      </div>

      <div className="grid gap-6 stagger md:grid-cols-2">
        {VIDEOS.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        These are the channel&rsquo;s most recent uploads. If a fresher banger drops, swap it in. 🎬
      </p>
    </div>
  );
}

function VideoCard({ video }: { video: ApprovedVideo }) {
  const [playing, setPlaying] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const thumb = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <Card className="lift overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="group absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt={video.title} className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 fill-white text-white" />
              </span>
            </span>
            <span className="absolute left-2 top-2"><Badge variant="default">{video.kind}</Badge></span>
          </button>
        )}
      </div>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-semibold leading-snug">{video.title}</h3>
          <Badge variant="success" className="shrink-0 gap-1"><BadgeCheck className="h-3 w-3" /> Approved</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {video.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" /> Open on YouTube
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
