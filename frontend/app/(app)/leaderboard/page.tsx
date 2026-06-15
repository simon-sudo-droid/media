"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Entry = { rank: number; full_name: string; xp: number; level: string };

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api<Entry[]>("/leaderboard").then(setEntries).catch(() => {});
  }, []);

  const medal = ["text-amber-400", "text-zinc-300", "text-orange-400"];

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top editors by XP. Keep training to climb the ranks.</p>
      </div>

      <Card>
        <CardContent className="p-3">
          {entries.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No rankings yet.</p>}
          <div className="divide-y divide-border">
            {entries.map((e) => {
              const isMe = user && (e.full_name === user.full_name || e.full_name === user.email.split("@")[0]);
              return (
                <div key={e.rank} className={`flex items-center gap-4 rounded-lg px-4 py-3 ${isMe ? "bg-primary/10" : ""}`}>
                  <div className="w-8 text-center">
                    {e.rank <= 3 ? <Crown className={`mx-auto h-5 w-5 ${medal[e.rank - 1]}`} /> : <span className="text-sm font-semibold text-muted-foreground">{e.rank}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{e.full_name}{isMe && <span className="ml-2 text-xs text-primary">(you)</span>}</div>
                    <div className="text-xs text-muted-foreground">{e.level}</div>
                  </div>
                  <Badge variant="default" className="gap-1"><Trophy className="h-3 w-3" /> {e.xp.toLocaleString()} XP</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
