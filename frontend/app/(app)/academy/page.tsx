"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import {
  BookOpen, GraduationCap, Library, Search, Plus, ExternalLink, Loader2,
  Target, Eye, Dumbbell, ListChecks, Flame, ArrowRight, ArrowLeft, X, Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChallengeCard, type Challenge } from "@/components/challenge-card";
import { PageHero } from "@/components/page-hero";

const HUB_TILES = [
  { icon: Target, x: "left-[9%]", y: "top-[28%]", d: "0s" },
  { icon: Library, x: "left-[16%]", y: "top-[66%]", d: "0.9s" },
  { icon: BookOpen, x: "right-[10%]", y: "top-[26%]", d: "0.5s" },
  { icon: Flame, x: "right-[17%]", y: "top-[66%]", d: "1.3s" },
];

/* ── Tab 1: Marketing Mastery ──────────────────────────────── */
type Week = {
  week: number; title: string; summary: string; overview: string;
  practice: string; watch: string; learn: string;
  scenarios: { title: string; situation: string; approach: string }[];
};
const WEEKS: Week[] = [
  {
    week: 1, title: "Foundations & the cut",
    summary: "When to cut, what to cut on, and how to make cuts invisible.",
    overview: "The cut is the editor's most basic tool — and the hardest to truly master. Every cut should answer one question: “what does the viewer need to see next?” This week you build the instinct for cutting on motion, using J/L cuts to smooth transitions, and hiding jumps so the edit feels effortless rather than assembled.",
    practice: "Re-cut one clip three different ways; cut strictly on action.",
    watch: "Breakdowns of clean dialogue scenes; notice where they cut.",
    learn: "Hard cuts, J-cuts, L-cuts, cutaways, cutting on action.",
    scenarios: [
      { title: "Choppy dialogue", situation: "An interview feels jerky after you trim it.", approach: "Cut on the natural breath or pause, use J/L cuts so audio leads or trails the picture, and cover any hard jump with a relevant cutaway." },
      { title: "Two takes, one line", situation: "You have two takes of the same sentence and want one clean line.", approach: "Cut mid-sentence on a matching word or mouth shape (a match cut) so the two takes read as a single performance." },
      { title: "Dead pause mid-answer", situation: "There's a 4-second silent gap in a good answer.", approach: "Ripple-trim the gap to close it — or, if the pause is meaningful, bridge it with a cutaway instead of leaving dead air." },
      { title: "Action cut looks jumpy", situation: "Cutting between two shots of the same movement looks off.", approach: "Cut in the middle of the action and match motion direction and speed across the cut so the eye carries over it." },
      { title: "Only a static talking head", situation: "The client gave you one locked-off talking-head shot.", approach: "Create visual cuts with subtle punch-ins (a small scale-up) on each new point, so the frame changes even without extra footage." },
    ],
  },
  {
    week: 2, title: "Pacing & rhythm",
    summary: "Control energy with shot length, silence, and cutting to rhythm.",
    overview: "Pacing is the heartbeat of an edit — it tells the viewer how to feel. Fast cuts create energy; held shots create weight. This week you learn to read the energy curve of your content and music, vary shot length on purpose, and use silence as deliberately as sound.",
    practice: "Cut a 30-second montage to the beat of a track.",
    watch: "High-retention edits — count how long each shot holds.",
    learn: "Varying shot length, cutting on motion, pattern interrupts.",
    scenarios: [
      { title: "Sagging middle", situation: "Retention dips hard around the 40% mark.", approach: "Shorten shots, cut tangents, and add a pattern interrupt (zoom, SFX, or b-roll) every 7–10 seconds to reset attention." },
      { title: "Montage to music", situation: "You need an energetic progress montage.", approach: "Mark the beats, cut on the downbeat, and match shot length to the track's energy — quicker in the chorus, longer in the verse." },
      { title: "Emotional beat rushed", situation: "A heartfelt line gets cut away too quickly.", approach: "Hold the shot a beat longer and add a breath of silence so the moment lands before you cut." },
      { title: "Energy cliff after the hook", situation: "A punchy intro drops into a flat body.", approach: "Carry momentum with motivated movement and slightly quicker cuts; don't let the pace fall off a cliff once the hook ends." },
      { title: "Podcast clip drags", situation: "A talking clip feels slow and loses people.", approach: "Tighten by removing filler and pauses, and cut to a reaction or cutaway on the punchline for a beat of rhythm." },
    ],
  },
  {
    week: 3, title: "Hooks (first 3 seconds)",
    summary: "Open with a curiosity gap or a bold promise — instantly.",
    overview: "The first three seconds decide whether anyone watches the next thirty. A hook has to create a curiosity gap or a bold, specific promise before the viewer's thumb moves. This week you learn to front-load intrigue, pair verbal and visual hooks, and open loops the viewer needs to close.",
    practice: "Make five different openings for the same video.",
    watch: "Top short-form hooks — why do they stop the scroll?",
    learn: "Open loops, bold claims, curiosity gaps, teaser-then-rewind.",
    scenarios: [
      { title: "Slow intro (“Hi guys…”)", situation: "The video opens with a greeting and setup.", approach: "Delete the greeting entirely; open on the single most surprising line or result." },
      { title: "Buried payoff", situation: "The best moment is at 0:40.", approach: "Cold-open with a teaser of that payoff, then rewind — “here's how I got there.”" },
      { title: "No visual hook", situation: "The opening is verbally strong but visually dead.", approach: "Pair the line with motion, bold text, or a striking b-roll frame within the first second." },
      { title: "Weak, generic claim", situation: "The hook is vague (“let's talk about focus”).", approach: "Make it specific and stakes-driven: “I wasted 3 years ignoring this one habit.”" },
      { title: "Question hook falls flat", situation: "A yes/no question opens the video.", approach: "Replace it with an open loop the viewer must resolve, not a question they can answer and scroll past." },
    ],
  },
  {
    week: 4, title: "B-roll & coverage",
    summary: "Choose visuals that represent the idea and cover the whole edit.",
    overview: "B-roll advances meaning and hides cuts — it's never just filler. This week you learn to mix shot types for variety, choose conceptual visuals for abstract lines, and cover an entire talking-head edit so the eye never gets bored.",
    practice: "Cover a full talking head using only b-roll.",
    watch: "Conceptual (non-literal) b-roll examples.",
    learn: "Literal vs conceptual, shot-type variety, timing b-roll.",
    scenarios: [
      { title: "Repetitive stock", situation: "Everything feels same-y and repetitive.", approach: "Mix wide, medium, and close-up; never reuse the same clip; vary angle and subject across the sequence." },
      { title: "Abstract line", situation: "The script says “growth takes time.”", approach: "Use conceptual b-roll — a plant growing, a timelapse, calendar pages flipping — instead of a literal chart." },
      { title: "Covering a jump cut", situation: "There's a visible jump in the interview.", approach: "Lay a relevant cutaway over the cut point so the edit becomes invisible." },
      { title: "No b-roll available", situation: "You have nothing but the A-roll.", approach: "Use text/motion graphics, punch-ins, or search/generate stock scoped tightly to that beat." },
      { title: "B-roll timing", situation: "Your b-roll feels disconnected from the words.", approach: "Land the b-roll slightly before or on the matching narration so it reinforces the point as it's said." },
    ],
  },
  {
    week: 5, title: "Storytelling structure",
    summary: "Find and shape the story in raw footage: setup, tension, payoff.",
    overview: "Even a 30-second clip is a story. Setup → tension → payoff is what keeps people watching to the end. This week you learn to find the through-line in rambling footage, build stakes, and land endings that pay off attention.",
    practice: "Build a 60-second story with setup–tension–payoff.",
    watch: "Documentary and video-essay structure.",
    learn: "The three-act spine; callbacks; stakes and payoff.",
    scenarios: [
      { title: "Rambling interview", situation: "45 minutes of unstructured talking.", approach: "Find the through-line, build setup→conflict→resolution around it, and cut everything that doesn't serve that spine." },
      { title: "Weak ending", situation: "The video just trails off.", approach: "End on a callback to the hook or a clear takeaway/CTA so it lands rather than fades." },
      { title: "No tension", situation: "There's nothing pulling the viewer forward.", approach: "Make the stakes or consequence explicit early so the outcome actually matters." },
      { title: "Montage with no arc", situation: "A montage feels like random clips.", approach: "Give it a mini arc — before → process → after — so even the montage tells a story." },
      { title: "Reorder for impact", situation: "The footage is chronological but flat.", approach: "Move the most compelling moment earlier as an open loop, then resolve it later." },
    ],
  },
  {
    week: 6, title: "Short-form vs long-form",
    summary: "Repurpose one shoot into platform-native edits.",
    overview: "The same footage becomes very different edits depending on the platform. This week you learn to pull short-form moments from long content, edit to each platform's retention norms, and repurpose one asset into many.",
    practice: "Turn one interview into a Reel AND a long cut.",
    watch: "How creators repurpose across platforms.",
    learn: "Retention graphs, platform norms, reframing 9:16.",
    scenarios: [
      { title: "Reel from a long interview", situation: "You need a 45s Reel from a 40-min talk.", approach: "Pull a self-contained moment with its own hook and payoff, then reframe it to 9:16." },
      { title: "Long-form retention", situation: "A 12-min video loses viewers midway.", approach: "Chapter it, tease upcoming payoffs, and place pattern interrupts at the drop-off points." },
      { title: "Caption strategy", situation: "Deciding how to caption each format.", approach: "Bold, well-timed captions for sound-off short-form; lighter, cleaner captions for long-form." },
      { title: "Aspect-ratio reframe", situation: "Landscape footage needs to go vertical.", approach: "Auto-reframe to center the key action, then fix framing manually shot by shot." },
      { title: "One into many", situation: "You want maximum output from one shoot.", approach: "Slice the long piece into several clips, each with its own distinct hook." },
    ],
  },
  {
    week: 7, title: "Sound & color",
    summary: "Ducking, loudness targets, and a clean, simple grade.",
    overview: "Audio is half the edit and color sets the mood. Bad audio loses viewers faster than bad video. This week you learn to balance music under dialogue, hit consistent loudness, and apply a correction-first grade that looks intentional.",
    practice: "Duck music under a VO; apply a simple grade.",
    watch: "Sound-design and color breakdowns.",
    learn: "−16 LUFS loudness, ducking, correction before grade, LUTs.",
    scenarios: [
      { title: "Music drowns dialogue", situation: "The track fights the voiceover.", approach: "Duck music ~12 dB under speech and keep dialogue around −16 LUFS so words stay clear." },
      { title: "Inconsistent loudness", situation: "Volume jumps between clips.", approach: "Normalize to a target loudness and ride levels so the whole piece sits even." },
      { title: "Flat footage", situation: "The image looks dull and grey.", approach: "Correct exposure and white balance first, then add a gentle creative grade or LUT." },
      { title: "Mismatched shots", situation: "Two cameras don't match.", approach: "Match them using scopes (waveform/vectorscope), not just your eye, then fine-tune." },
      { title: "Harsh audio", situation: "The voice is sibilant with background hiss.", approach: "De-ess, apply noise reduction, and lay room tone under cuts so silence doesn't pop." },
    ],
  },
  {
    week: 8, title: "Client work & delivery",
    summary: "Briefs, revisions, naming, and delivering to spec.",
    overview: "Great editors are reliable, not just talented. This week you learn to interrogate a brief, manage revisions without scope creep, and deliver clean files to the exact platform spec — the professionalism that gets you rehired.",
    practice: "Do a revision pass; export to spec and name files.",
    watch: "How editors handle feedback and briefs.",
    learn: "Deliverables, revision rounds, file naming, export specs.",
    scenarios: [
      { title: "Vague brief", situation: "The client just says “make it pop.”", approach: "Ask for references, target platform, length, and tone before you touch the timeline." },
      { title: "Endless revisions", situation: "Feedback keeps trickling in.", approach: "Batch feedback into rounds, confirm scope, and deliver versioned exports; define what “done” means up front." },
      { title: "Wrong export", situation: "The file looks wrong on the platform.", approach: "Deliver to spec — correct codec, resolution, fps, and loudness (H.264 MP4 for most)." },
      { title: "File chaos", situation: "Nobody can find the latest version.", approach: "Name files consistently (project-episode-version) and keep the project and bins organized." },
      { title: "Deadline at risk", situation: "You might miss the delivery date.", approach: "Communicate early, send a rough cut for feedback, and protect autosave/backups to avoid losing work." },
    ],
  },
];

/* ── Tab 2: Books & Courses ────────────────────────────────── */
const googleBook = (title: string, author: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${title} ${author !== "—" ? author : ""} book`)}`;

const BOOK_THEMES = [
  { theme: "Craft & Theory", books: [
    { title: "In the Blink of an Eye", author: "Walter Murch", note: "The legendary editor's philosophy of the cut and why emotion comes first." },
    { title: "The Technique of Film & Video Editing", author: "Ken Dancyger", note: "A deep, historical grounding in editing theory and practice." },
  ]},
  { theme: "Storytelling & Pacing", books: [
    { title: "Edit Better", author: "Jeff Bartsch", note: "Practical storytelling-first editing for modern content creators." },
    { title: "Cut to the Chase", author: "Bobbie O'Steen", note: "Editors dissect how pacing and structure shape a scene." },
  ]},
  { theme: "Documentary Editing", books: [
    { title: "Documentary Editing: Principles & Practice", author: "—", note: "Shaping truth: interview-driven structure and narrative arcs." },
    { title: "First Cut: Conversations with Film Editors", author: "Gabriella Oldham", note: "Master editors on their craft and decision-making." },
  ]},
  { theme: "Technique & Workflow", books: [
    { title: "The Healthy Edit", author: "John Rosenberg", note: "Fixing story problems in the edit — trims, restructures, and rescues." },
    { title: "The Filmmaker's Handbook", author: "Steven Ascher & Edward Pincus", note: "The end-to-end reference for production and post workflow." },
  ]},
  { theme: "B-Roll & Coverage", books: [
    { title: "Grammar of the Edit", author: "Roy Thompson & Christopher Bowen", note: "Continuity, coverage, and the visual grammar behind shot choices." },
  ]},
];

const udemy = (q: string) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`;
const COURSES = [
  { title: "The Complete Adobe Premiere Pro Video Editing Bootcamp", by: "Louay Zambakji · Udemy", tag: "Paid", url: udemy("Complete Adobe Premiere Pro Video Editing Bootcamp Louay Zambakji") },
  { title: "Video Editing Masterclass: Edit Your Videos Like a Pro", by: "Julian Melanson · Udemy", tag: "Paid", url: udemy("Video Editing Masterclass Julian Melanson") },
  { title: "Premiere Pro Essentials & Advanced Training", by: "Daniel Walter Scott · Udemy", tag: "Paid", url: udemy("Premiere Pro Daniel Walter Scott") },
  { title: "Complete Adobe Premiere Pro Megacourse: Beginner to Expert", by: "Creativity Unleashed · Udemy", tag: "Paid", url: udemy("Complete Adobe Premiere Pro Megacourse Beginner to Expert") },
  { title: "50+ Generative AI Tools to 10x Business, Productivity, Creativity", by: "Julian Melanson & Benza Maman · Udemy", tag: "Paid", url: udemy("50+ Generative AI Tools Julian Melanson") },
  { title: "Learn Prompting", by: "learnprompting.thinkific.com", tag: "Free+Paid", url: "https://learnprompting.thinkific.com/" },
];
const TAG_VARIANT: Record<string, "success" | "warning" | "default"> = { "Free": "success", "Paid": "warning", "Free+Paid": "default" };

/* ── Tab 3: Glossary (dictionary) ──────────────────────────── */
type Dict = { term: string; meaning: string; example: string; category: string };
const DICTIONARY: Dict[] = [
  { term: "B-roll", category: "Video", meaning: "Supplementary footage cut over the main shot or narration to add context and cover edits.", example: "Cutting to hands typing while the host says “we worked late into the night.”" },
  { term: "A-roll", category: "Video", meaning: "Your primary footage — usually the talking head or main subject that carries the story.", example: "The interview take the whole edit is built around." },
  { term: "J-cut", category: "Video", meaning: "The audio of the next clip starts before its video, pulling the viewer forward.", example: "You hear the next scene's dialogue a second before you see it." },
  { term: "L-cut", category: "Video", meaning: "The audio of the current clip continues over the video of the next one.", example: "A speaker's voice carries over a cutaway to the audience." },
  { term: "Jump cut", category: "Video", meaning: "A cut between two similar shots that jumps in time.", example: "Trimming pauses from a talking head so it 'jumps' forward." },
  { term: "Match cut", category: "Video", meaning: "A cut between two shots linked by similar composition or motion.", example: "A spinning wheel cuts to a spinning record." },
  { term: "Cutaway", category: "Video", meaning: "A shot of something other than the main subject, used for detail or to hide an edit.", example: "Cutting from the interview to a close-up of a ringing phone." },
  { term: "Montage", category: "Video", meaning: "A sequence of short shots edited to compress time or show progress.", example: "A training montage covering weeks in 20 seconds." },
  { term: "Cross-dissolve", category: "Video", meaning: "A transition where one shot fades into the next; signals a time or place change.", example: "Dissolving from day to night over a skyline." },
  { term: "Color grading", category: "Video", meaning: "Creatively adjusting color and tone to set mood and a consistent look.", example: "Warm, lifted blacks for a nostalgic memory scene." },
  { term: "LUT", category: "Video", meaning: "Look-Up Table — a preset mapping input colors to output colors to apply a look.", example: "Applying a teal-and-orange LUT as a starting point." },
  { term: "Keyframe", category: "Video", meaning: "A marker setting a value at a point in time so it animates between markers.", example: "Keyframing opacity 0→100 to fade in a title." },
  { term: "Proxy", category: "Video", meaning: "A lightweight copy of footage for smooth editing; swapped for the original at export.", example: "Editing 4K on a laptop using 720p proxies." },
  { term: "Aspect ratio", category: "Video", meaning: "The width-to-height ratio of the frame.", example: "16:9 for YouTube, 9:16 for Reels/Shorts." },
  { term: "Frame rate", category: "Video", meaning: "How many frames are shown per second (fps).", example: "Shooting 60fps to get smooth slow motion in a 24fps timeline." },
  { term: "Speed ramp", category: "Video", meaning: "Smoothly changing playback speed within a clip.", example: "Ramping from slow-mo into real-time on an action beat." },
  { term: "Lower third", category: "Video", meaning: "A graphic in the lower part of the frame showing a name or caption.", example: "A guest's name and title sliding in during an interview." },
  { term: "Audio ducking", category: "Audio", meaning: "Automatically lowering music when speech plays so dialogue stays clear.", example: "Music drops ~12 dB whenever the host talks." },
  { term: "Sound bed", category: "Audio", meaning: "A background music or ambience layer running under the main audio.", example: "A soft ambient pad under a voiceover." },
  { term: "Room tone", category: "Audio", meaning: "The ambient sound of a location, used to smooth audio edits.", example: "Laying room tone under cuts so silence doesn't 'pop'." },
  { term: "LUFS", category: "Podcast", meaning: "Loudness Units Full Scale — the standard for perceived loudness.", example: "Mastering a podcast to −16 LUFS for consistent volume." },
  { term: "Noise floor", category: "Audio", meaning: "The level of constant background noise in a recording.", example: "A high noise floor = audible hiss under the voice." },
  { term: "De-esser", category: "Audio", meaning: "A processor that tames harsh 's' and 't' sounds.", example: "De-essing a sibilant narrator." },
  { term: "Waveform", category: "Audio", meaning: "The visual shape of audio amplitude over time.", example: "Cutting on the waveform to trim silence precisely." },
  { term: "Filler words", category: "Podcast", meaning: "Ums, uhs, and repeated phrases removed to tighten speech.", example: "Cutting every 'um' from a podcast clip." },
  { term: "Thumbnail", category: "Thumbnail", meaning: "The clickable cover image representing a video.", example: "A bold face + 3-word text thumbnail for a YouTube video." },
  { term: "Focal point", category: "Thumbnail", meaning: "The element the eye lands on first in a frame or thumbnail.", example: "A surprised face as the clear focal point." },
  { term: "Rule of thirds", category: "Thumbnail", meaning: "Placing key elements along thirds of the frame for balance.", example: "Subject's eyes on the upper-third line." },
  { term: "Safe area", category: "Thumbnail", meaning: "The zone kept clear of edges so nothing important gets cropped.", example: "Keeping text inside the safe area for all devices." },
];

const TABS = [
  { key: "mastery", label: "Marketing Mastery", icon: Target },
  { key: "library", label: "Books & Courses", icon: Library },
  { key: "glossary", label: "Glossary", icon: BookOpen },
  { key: "practice", label: "Quizzes & Challenges", icon: Flame },
];

export default function LearningHubPage() {
  const [tab, setTab] = useState("mastery");
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHero
        eyebrow="Learning Hub"
        icon={GraduationCap}
        title={<>Get better <span className="text-gradient">every week</span></>}
        subtitle="The path, the library, the language, and the practice — everything to sharpen your craft."
        tiles={HUB_TILES}
      />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "mastery" && <Mastery />}
      {tab === "library" && <Library_ />}
      {tab === "glossary" && <Glossary />}
      {tab === "practice" && <Practice />}
    </div>
  );
}

function Mastery() {
  const [sel, setSel] = useState<number | null>(null);
  const w = WEEKS.find((x) => x.week === sel);

  if (w) {
    return (
      <div className="space-y-5 animate-in">
        <button onClick={() => setSel(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to all weeks
        </button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">W{w.week}</span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{w.title}</h2>
                <p className="text-sm text-muted-foreground">{w.summary}</p>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-foreground/90">{w.overview}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MasteryCell icon={Dumbbell} label="Practice" text={w.practice} />
              <MasteryCell icon={Eye} label="Watch" text={w.watch} />
              <MasteryCell icon={GraduationCap} label="Learn" text={w.learn} />
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">5 real-world scenarios</h3>
          </div>
          <div className="space-y-3">
            {w.scenarios.map((s, i) => (
              <Card key={i} className="lift">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">{i + 1}</span>
                    <div className="min-w-0">
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Situation: </span>{s.situation}</p>
                      <p className="mt-1 text-sm text-foreground/90"><span className="font-medium text-primary">Do this: </span>{s.approach}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger">
      <p className="text-sm text-muted-foreground">An 8-week loop for editors. Click any week to go deeper — overview, what to practice/watch/learn, and 5 real-world scenarios.</p>
      {WEEKS.map((wk) => (
        <button key={wk.week} onClick={() => setSel(wk.week)} className="block w-full text-left">
          <Card className="lift">
            <CardContent className="flex items-center gap-3 p-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">W{wk.week}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{wk.title}</h3>
                <p className="truncate text-sm text-muted-foreground">{wk.summary}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">Learn more <ArrowRight className="h-4 w-4" /></span>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
function MasteryCell({ icon: Icon, label, text }: { icon: any; label: string; text: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</div>
      <p className="text-sm text-foreground/90">{text}</p>
    </div>
  );
}

function Library_() {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        {BOOK_THEMES.map((group) => (
          <section key={group.theme} className="space-y-3">
            <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">{group.theme}</h2><div className="h-px flex-1 bg-border" /></div>
            <div className="grid gap-4 stagger sm:grid-cols-2 lg:grid-cols-3">
              {group.books.map((b) => (
                <Card key={b.title} className="lift h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    <BookOpen className="mb-3 h-5 w-5 text-primary" />
                    <h3 className="font-semibold leading-snug">{b.title}</h3>
                    {b.author !== "—" && <p className="text-xs text-muted-foreground">{b.author}</p>}
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.note}</p>
                    <a href={googleBook(b.title, b.author)} target="_blank" rel="noopener noreferrer" className="mt-3">
                      <Button variant="outline" size="sm" className="w-full gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Visit</Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="space-y-3">
        <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">Courses & Platforms</h2><div className="h-px flex-1 bg-border" /></div>
        <div className="grid gap-4 stagger sm:grid-cols-2">
          {COURSES.map((c) => (
            <Card key={c.title} className="lift">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold leading-snug">{c.title}</h3><Badge variant={TAG_VARIANT[c.tag]}>{c.tag}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.by}</p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Visit</Button></a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

type Term = { id: number; term: string; definition: string; created_at: string };
function Glossary() {
  const [userTerms, setUserTerms] = useState<Dict[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Dict | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<Term[]>("/glossary").then((rows) =>
      setUserTerms(rows.map((r) => ({ term: r.term, meaning: r.definition, example: "", category: "Community" })))
    ).catch(() => {});
  }
  useEffect(load, []);

  // Community terms first (newest additions), then the built-in dictionary.
  const all = useMemo(() => {
    const seen = new Set<string>();
    const merged: Dict[] = [];
    for (const t of [...userTerms, ...DICTIONARY]) {
      const k = t.term.toLowerCase();
      if (!seen.has(k)) { seen.add(k); merged.push(t); }
    }
    return merged;
  }, [userTerms]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter((t) => t.term.toLowerCase().includes(n) || t.meaning.toLowerCase().includes(n) || t.example.toLowerCase().includes(n));
  }, [q, all]);

  // Exact-ish match shows as the headline definition (dictionary feel).
  const headline = selected || (q.trim() ? filtered.find((t) => t.term.toLowerCase() === q.trim().toLowerCase()) || filtered[0] : null);

  async function add() {
    if (!newTerm.trim() || !newDef.trim()) return;
    setBusy(true);
    try {
      await api("/glossary", { method: "POST", body: { term: newTerm, definition: newDef } });
      setNewTerm(""); setNewDef(""); setAdding(false); load();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }} placeholder="Search any editing, audio, podcast, or thumbnail term…"
            className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <Button variant="gradient" onClick={() => setAdding((v) => !v)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Term</Button>
      </div>

      {adding && (
        <Card className="animate-in"><CardContent className="space-y-3 p-5">
          <input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Term (e.g. Whip pan)" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <textarea value={newDef} onChange={(e) => setNewDef(e.target.value)} placeholder="Definition…" className="min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" disabled={busy || !newTerm.trim() || !newDef.trim()} onClick={add}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save term</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Dictionary headline definition */}
      {headline && (
        <Card className="border-primary/30 animate-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-primary">{headline.term}</h2>
                  <Badge variant="secondary">{headline.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-foreground/90"><span className="font-medium">Meaning: </span>{headline.meaning}</p>
                {headline.example && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground/80">Example: </span>{headline.example}</p>}
              </div>
              {selected && <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related / popular searches */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {q.trim() ? "Related searches" : "Popular searches"}
        </div>
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => (
            <button key={t.term} onClick={() => setSelected(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${headline?.term === t.term ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"}`}>
              {t.term}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No terms match “{q}”. Try “+ Add Term” to define it.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Tab 4: Quizzes & Challenges ───────────────────────────── */
type Course = { id: number; slug: string; title: string; description: string; level: string; category: string; icon: string; lesson_count: number; completed_count: number };
type Quiz = { id: number; slug: string; title: string; topic: string; level: string; description: string; question_count: number };
const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "policy"];
const LEVEL_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", policy: "Company Policy" };

function Practice() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  function loadCh() { api<Challenge[]>("/challenges").then(setChallenges).catch(() => {}); }
  useEffect(() => {
    api<Course[]>("/courses").then(setCourses).catch(() => {});
    api<Quiz[]>("/quizzes").then(setQuizzes).catch(() => {});
    loadCh();
  }, []);

  const grouped = LEVEL_ORDER.map((l) => ({ level: l, items: courses.filter((c) => c.level === l) })).filter((g) => g.items.length);
  const KIND_LABEL: Record<string, string> = { daily: "Daily", broll: "B-roll", editing: "Editing" };
  const chGrouped = ["daily", "broll", "editing"].map((k) => ({ kind: k, items: challenges.filter((c) => c.kind === k) })).filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      {/* Courses */}
      {grouped.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Courses</h2></div>
          {grouped.map((g) => (
            <div key={g.level} className="space-y-3">
              <div className="flex items-center gap-3"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{LEVEL_LABEL[g.level]}</h3><div className="h-px flex-1 bg-border" /></div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => {
                  const Icon = (Icons as any)[c.icon] || Icons.GraduationCap;
                  const pct = c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
                  return (
                    <Link key={c.id} href={`/academy/${c.slug}`}>
                      <Card className="lift h-full"><CardContent className="flex h-full flex-col p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                          <Badge variant="secondary">{LEVEL_LABEL[c.level]}</Badge>
                        </div>
                        <h4 className="font-semibold">{c.title}</h4>
                        <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                        <div className="mt-4 space-y-2"><Progress value={pct} /><div className="text-xs text-muted-foreground">{c.completed_count}/{c.lesson_count} lessons</div></div>
                      </CardContent></Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Quizzes</h2></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <Link key={q.id} href={`/quizzes/${q.slug}`}>
                <Card className="lift h-full"><CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary"><ListChecks className="h-5 w-5" /></div>
                    <Badge variant="secondary" className="capitalize">{q.level}</Badge>
                  </div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{q.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{q.question_count} questions</span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary">Start <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent></Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Challenges */}
      {chGrouped.map((g) => (
        <section key={g.kind} className="space-y-4">
          <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /><h2 className="text-lg font-semibold">{KIND_LABEL[g.kind]} Challenges</h2></div>
          <div className="grid gap-5 md:grid-cols-2">
            {g.items.map((c) => <ChallengeCard key={c.id} challenge={c} onDone={loadCh} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
