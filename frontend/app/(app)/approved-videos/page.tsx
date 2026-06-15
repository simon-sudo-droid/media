"use client";

import { useState } from "react";
import { BadgeCheck, Play, ExternalLink, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ApprovedVideo = {
  id: string;
  title: string;
  description: string;
  url: string;       // Frame.io share link
  tags: string[];
};

// Curated list of approved reference edits. Add more by extending this array.
const VIDEOS: ApprovedVideo[] = [
  {
    id: "zRvaamNM",
    title: "Approved Reference Edit — 1",
    description: "A signed-off edit to model your work on. Study the pacing, caption style, b-roll variety, and how the cuts hold attention.",
    url: "https://f.io/zRvaamNM",
    tags: ["Pacing", "Captions", "B-roll variety"],
  },
  {
    id: "aGahXH1S",
    title: "Approved Reference Edit — 2",
    description: "Another approved example. Notice the shot variety (wide / medium / close), audio balance, and clean transitions.",
    url: "https://f.io/aGahXH1S",
    tags: ["Shot variety", "Audio balance", "Transitions"],
  },
];

export default function ApprovedVideosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="animate-in">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight">Approved Videos</h1>
        </div>
        <p className="text-muted-foreground">
          Reference edits that have been signed off. Watch them here and match this standard in your own work.
        </p>
      </div>

      <div className="grid gap-6 stagger md:grid-cols-2">
        {VIDEOS.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: ApprovedVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <Card className="lift overflow-hidden">
      <div className="relative aspect-video w-full bg-black/60">
        {playing ? (
          <iframe
            src={video.url}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/20 to-fuchsia-500/20"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-black/50 backdrop-blur transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-white text-white" />
            </div>
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
              <Film className="h-3.5 w-3.5" /> Click to play
            </span>
          </button>
        )}
      </div>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{video.title}</h3>
              <Badge variant="success" className="gap-1"><BadgeCheck className="h-3 w-3" /> Approved</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {video.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Open in Frame.io
          </Button>
        </a>
        {playing && (
          <p className="text-xs text-muted-foreground">
            Not loading above? Frame.io may block embedding — use “Open in Frame.io”.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
