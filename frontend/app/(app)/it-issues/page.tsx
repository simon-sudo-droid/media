"use client";

import { useMemo, useState } from "react";
import { Wrench, Search, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Issue = { tool: string; issue: string; resolutions: string[] };

const ISSUES: Issue[] = [
  {
    tool: "Riverside",
    issue: "Riverside doesn't fully capture certain errors and verbal mistakes — particularly subtle mispronunciations, pauses, and filler words.",
    resolutions: [
      "Improve audio clarity where possible to support better detection.",
      "Reduce reliance on Riverside's auto-editing.",
      "Implement a manual review pass after editing to ensure higher accuracy.",
    ],
  },
  {
    tool: "Riverside",
    issue: "After uploading my video, it shows a blank screen despite restarting the device, refreshing, and reopening the browser.",
    resolutions: [
      "Wait for processing to finish.",
      "Check the file locally.",
      "Re-export in H.264 MP4.",
      "Verify upload specs.",
      "Delete and re-upload if needed.",
    ],
  },
  {
    tool: "Premiere Pro",
    issue: "While editing, Premiere Pro froze and had to be force-closed. After reopening, recent progress was lost despite manual and automatic saves being enabled. This has happened twice.",
    resolutions: [
      "Force-close Premiere Pro, clear the media cache, and restart the PC.",
      "Check Premiere Pro's autosave and Project Recovery settings to help prevent future data loss.",
      "Lower the autosave interval (e.g. every 5 minutes) and increase the number of saved versions.",
      "Save incremental project versions (Save As) at major milestones.",
    ],
  },
  {
    tool: "Premiere Pro",
    issue: "Playback is laggy / choppy on the timeline.",
    resolutions: [
      "Set playback resolution to 1/2 or 1/4.",
      "Generate proxies for high-resolution footage.",
      "Clear the media cache (Preferences → Media Cache).",
      "Update GPU drivers and enable GPU acceleration in project settings.",
    ],
  },
  {
    tool: "Premiere Pro",
    issue: "Export fails or the app crashes during render.",
    resolutions: [
      "Export through Adobe Media Encoder instead of direct export.",
      "Set a clean In/Out range and disable any corrupt effects on the failing clip.",
      "Update GPU drivers; toggle between Software and GPU encoding.",
      "Clear cache and restart before retrying.",
    ],
  },
  {
    tool: "Frame.io",
    issue: "Uploaded video shows a black screen / won't play for reviewers.",
    resolutions: [
      "Wait for Frame.io to finish transcoding the proxy.",
      "Re-export as H.264 MP4 with standard specs (yuv420p).",
      "Confirm the reviewer has access/permission to the asset.",
      "Try a different browser or the Frame.io desktop app.",
    ],
  },
  {
    tool: "Frame.io",
    issue: "Comments or version stacks aren't syncing / showing up.",
    resolutions: [
      "Refresh and confirm you're viewing the correct version in the stack.",
      "Clear browser cache or use an incognito window.",
      "Check the project's collaborator permissions.",
      "Re-upload as a new version into the existing stack.",
    ],
  },
  {
    tool: "HeyGen",
    issue: "Avatar lip-sync is off or timing doesn't match the script.",
    resolutions: [
      "Add proper punctuation so the engine paces speech correctly.",
      "Shorten or split long sentences.",
      "Match the selected voice language to the script language.",
      "Regenerate the segment; if persistent, try a different avatar/voice.",
    ],
  },
  {
    tool: "HeyGen",
    issue: "Render is stuck in the queue or fails.",
    resolutions: [
      "Confirm you have enough credits on the plan.",
      "Reduce the clip length and retry.",
      "Re-submit the job after a few minutes (queue load varies).",
    ],
  },
  {
    tool: "ElevenLabs",
    issue: "Voiceover sounds robotic or mispronounces specific words/names.",
    resolutions: [
      "Spell tricky words phonetically or add pronunciation aliases.",
      "Adjust Stability and Similarity sliders for a more natural read.",
      "Use punctuation/line breaks to control pauses and emphasis.",
      "Try a different voice better suited to the tone.",
    ],
  },
  {
    tool: "ElevenLabs",
    issue: "Audio gets cut off or hits a character limit.",
    resolutions: [
      "Split the script into smaller chunks and stitch in the editor.",
      "Check your monthly character quota.",
      "Avoid pasting hidden/duplicate characters from other apps.",
    ],
  },
  {
    tool: "Storyblocks",
    issue: "Downloaded clip isn't 4K, or has a watermark.",
    resolutions: [
      "Confirm your subscription tier includes 4K downloads.",
      "Select the 4K/HD option explicitly before downloading.",
      "Re-download; a watermark usually means a preview was saved, not the licensed file.",
    ],
  },
  {
    tool: "Storyblocks",
    issue: "Clip won't import or play correctly in Premiere Pro.",
    resolutions: [
      "Transcode to ProRes (Mac) or H.264/DNxHD before importing.",
      "Confirm the codec is supported by your Premiere version.",
      "Re-download the file in case of a partial/corrupt download.",
    ],
  },
];

const TOOLS = ["All", ...Array.from(new Set(ISSUES.map((i) => i.tool)))];

const TOOL_COLOR: Record<string, string> = {
  Riverside: "bg-violet-500/15 text-violet-300",
  "Premiere Pro": "bg-fuchsia-500/15 text-fuchsia-300",
  "Frame.io": "bg-sky-500/15 text-sky-300",
  HeyGen: "bg-emerald-500/15 text-emerald-300",
  ElevenLabs: "bg-amber-500/15 text-amber-300",
  Storyblocks: "bg-cyan-500/15 text-cyan-300",
};

export default function ITIssuesPage() {
  const [tool, setTool] = useState("All");
  const [q, setQ] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ISSUES.filter((i) =>
      (tool === "All" || i.tool === tool) &&
      (!needle ||
        i.issue.toLowerCase().includes(needle) ||
        i.tool.toLowerCase().includes(needle) ||
        i.resolutions.some((r) => r.toLowerCase().includes(needle)))
    );
  }, [tool, q]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="animate-in">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">IT Technical Issues</h1>
        </div>
        <p className="text-muted-foreground">When the tools fight back — known issues and fixes for the editing stack. 🛠️</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search issues, tools, or fixes…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Tool filter */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tool === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Issues */}
      <div className="space-y-3 stagger">
        {filtered.map((it, i) => {
          const open = openIdx === i;
          return (
            <Card key={i} className="overflow-hidden">
              <button onClick={() => setOpenIdx(open ? null : i)} className="flex w-full items-start gap-3 p-5 text-left">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1">
                  <span className={`mb-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${TOOL_COLOR[it.tool] || "bg-secondary"}`}>{it.tool}</span>
                  <p className="text-sm font-medium">{it.issue}</p>
                </div>
                <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <CardContent className="border-t border-border bg-secondary/20 p-5 pt-4 animate-in">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resolution</div>
                  <ul className="space-y-2">
                    {it.resolutions.map((r, ri) => (
                      <li key={ri} className="flex items-start gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No issues match “{q}”. Try a different search or tool.</p>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Hit a new issue? Document it here so the next editor doesn&rsquo;t lose an afternoon to it.
      </p>
    </div>
  );
}
