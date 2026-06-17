// "What's New" announcements shown in the notifications panel.
// Higher id = newer. Bump the list when you ship something noteworthy
// (e.g. new quizzes/questions) and users get an unread badge.
export type Announcement = {
  id: number;
  date: string;
  title: string;
  body: string;
  tag: "Quizzes" | "Feature" | "Content" | "Fix";
};

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 7, date: "2026-06-17", tag: "Feature", title: "Light & dark mode",
    body: "Pick your appearance in Settings — System, Light, or Dark." },
  { id: 6, date: "2026-06-17", tag: "Content", title: "IT Technical Issues hub",
    body: "Fixes for Riverside, Premiere Pro, Frame.io, HeyGen, ElevenLabs & Storyblocks." },
  { id: 5, date: "2026-06-16", tag: "Quizzes", title: "+25 new quiz questions",
    body: "Two new quizzes added: ‘B-roll & Visual Storytelling’ and ‘Editing Workflows & Delivery Specs’." },
  { id: 4, date: "2026-06-16", tag: "Feature", title: "B-roll generation",
    body: "Generate sample clips and open optimized searches in Storyblocks for 4K/1080p downloads." },
  { id: 3, date: "2026-06-15", tag: "Content", title: "Approved Videos",
    body: "Watch the latest approved reference edits without leaving the app." },
  { id: 2, date: "2026-06-15", tag: "Feature", title: "Checklists",
    body: "Production workflows with per-step progress tracking." },
  { id: 1, date: "2026-06-14", tag: "Content", title: "Training & Probation Policy",
    body: "Added to the Learning Academy." },
];

const SEEN_KEY = "em-whatsnew-seen";

export function lastSeenId(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(SEEN_KEY) || 0);
}

export function unreadCount(): number {
  const seen = lastSeenId();
  return ANNOUNCEMENTS.filter((a) => a.id > seen).length;
}

export function markAllSeen(): void {
  if (typeof window === "undefined") return;
  const maxId = ANNOUNCEMENTS.reduce((m, a) => Math.max(m, a.id), 0);
  window.localStorage.setItem(SEEN_KEY, String(maxId));
}
