// Marketing Mastery — the 8-week deep-dive curriculum for editors.
// Each week is a mini-course: overview, goal, lessons, drill, takeaways,
// and 5 real-world scenarios with the why, the steps, and the pitfall.

export type Scenario = {
  title: string;
  situation: string;
  approach: string;   // the short answer — "do this"
  why: string;        // the principle behind it
  steps: string[];    // concrete, in-the-timeline steps
  pitfall: string;    // the mistake that ruins it
};

export type Lesson = {
  heading: string;
  body: string;       // the deep explanation
  points: string[];   // key techniques to remember
};

export type Week = {
  week: number;
  title: string;
  summary: string;
  overview: string;   // multi-paragraph (\n\n) intro to the week
  goal: string;       // what you can DO by the end of the week
  lessons: Lesson[];
  practice: string;
  watch: string;
  learn: string;
  drill: string[];    // this week's step-by-step exercise
  takeaways: string[];
  scenarios: Scenario[];
};

export const WEEKS: Week[] = [
  /* ── Week 1 ─────────────────────────────────────────────── */
  {
    week: 1,
    title: "Foundations & the cut",
    summary: "When to cut, what to cut on, and how to make cuts invisible.",
    overview:
      "The cut is the editor's most basic tool — and the hardest to truly master. Every cut should answer one question: “what does the viewer need to see next?” A cut is a promise that something new is coming; if the next shot doesn't add information or emotion, the cut wasn't earned.\n\nWalter Murch, editor of Apocalypse Now, ranked the reasons to cut: emotion first, story second, rhythm third — and technical continuity last. That ordering surprises new editors, and it's the single biggest mindset shift of this week: a cut that feels right beats a cut that is technically clean. This week you build the instinct for cutting on motion, using J/L cuts to smooth transitions, and hiding jumps so the edit feels effortless rather than assembled.",
    goal: "By the end of this week you can cut a 2-minute dialogue scene so cleanly that a viewer never notices a single edit.",
    lessons: [
      {
        heading: "Why we cut: new information, emotion first",
        body:
          "A cut works when it delivers something new — a reaction, a detail, a change of perspective. If two consecutive shots say the same thing, the second one is dead weight. Murch's hierarchy puts emotion above everything: viewers forgive a mismatched hand position, but they never forgive a moment that feels wrong. Train yourself to ask, at every cut point, “what is the viewer feeling right now, and what do they want to see next?” When you cut to what they want a beat before they know they want it, the edit feels inevitable.",
        points: [
          "Every cut must add new information or a new emotion — otherwise trim, don't cut.",
          "Murch's rule of six: emotion > story > rhythm > eye-trace > screen plane > continuity.",
          "The viewer's blink is a natural cut point — people blink when they finish absorbing a thought.",
          "Test: watch your edit muted. If a cut jars with no sound, it will jar with sound.",
        ],
      },
      {
        heading: "The cutting vocabulary: J, L, match, jump, cutaway",
        body:
          "Each cut type solves a specific problem. A hard cut is the default — clean, instant. A J-cut lets the next scene's audio arrive early, pulling the viewer forward before the picture changes; an L-cut lets the current audio trail over the next picture, easing them out. Cutaways buy you freedom: once the viewer sees something else, you can rejoin the main shot anywhere. Match cuts link two shots through composition or motion, and jump cuts — once a mistake — are now a deliberate short-form language for compressing time. Knowing which tool fits which moment is what separates cutting from chopping.",
        points: [
          "J-cut = audio leads video (great into a new scene); L-cut = audio trails (great out of dialogue).",
          "A cutaway resets the viewer's memory of framing — after one, you can rejoin the A-roll anywhere.",
          "Match cuts need ONE strong link: shape, motion direction, or color.",
          "Deliberate jump cuts must be rhythmic and consistent — random ones read as errors.",
        ],
      },
      {
        heading: "Cutting on action & hiding the seams",
        body:
          "The eye follows motion. If you cut in the middle of a movement — a head turn, a hand reaching, a door swinging — the motion carries the viewer's attention across the cut and the edit disappears. Cutting on stillness exposes the edit; cutting on action hides it. The same principle powers audio bridges: when sound flows continuously across a picture cut, the brain assumes continuity. Your job is to give the viewer's senses something continuous to hold onto while the picture changes underneath them.",
        points: [
          "Cut mid-action, not before or after it — the movement masks the switch.",
          "Match motion direction and speed across the cut (left-to-right stays left-to-right).",
          "Continuous audio under a cut sells continuity even when the picture jumps.",
          "When stuck, cut on a sound: a door slam, a beat, a word with a hard consonant.",
        ],
      },
    ],
    practice: "Take one 2-minute dialogue clip and cut it three different ways: (1) as tight as possible, (2) with breathing room and J/L cuts, (3) stylized with deliberate jump cuts. Compare how each version feels.",
    watch: "Breakdowns of clean dialogue scenes — pause at every cut and name why the editor cut there (new info? reaction? rhythm?).",
    learn: "Hard cuts, J-cuts, L-cuts, cutaways, match cuts, cutting on action, Murch's rule of six.",
    drill: [
      "Pick a 2-minute two-person dialogue clip (any interview or podcast works).",
      "Pass 1 — cut every pause and filler word. Watch it: too tight? Note where it suffocates.",
      "Pass 2 — reopen the moments that need air, and convert 5 hard cuts into J- or L-cuts.",
      "Pass 3 — cover your two most visible cuts with cutaways or punch-ins.",
      "Final test: watch muted, then with sound, then show someone. If they can't count the cuts, you passed.",
    ],
    takeaways: [
      "A cut is earned by new information or new emotion — never cut just because you can.",
      "Emotion outranks continuity: a cut that feels right IS right.",
      "Motion hides cuts; stillness exposes them.",
      "J/L cuts are the fastest upgrade from 'chopped' to 'professional'.",
    ],
    scenarios: [
      {
        title: "Choppy dialogue",
        situation: "An interview feels jerky after you trim it — every cut is visible and the rhythm is gone.",
        approach: "Cut on the natural breath or pause, use J/L cuts so audio leads or trails the picture, and cover any hard jump with a relevant cutaway.",
        why: "Hard cuts placed mid-breath fight the speaker's natural rhythm. When audio flows across the cut (J/L), the brain hears continuity and stops noticing the picture change.",
        steps: [
          "Find each cut point and slide it to the end of a breath or sentence — cut where the speaker would naturally pause.",
          "Extend the incoming audio 8–15 frames under the outgoing video (J-cut) or vice versa (L-cut).",
          "Where the jump is still visible, lay a 1–2 second cutaway (hands, listener, environment) over the cut point.",
          "Watch with eyes closed: if the audio flows naturally, the edit will too.",
        ],
        pitfall: "Don't J/L-cut every single edit by the same amount — uniform offsets create their own robotic rhythm. Vary the overlap.",
      },
      {
        title: "Two takes, one line",
        situation: "You have two takes of the same sentence and want one clean line from the best halves.",
        approach: "Cut mid-sentence on a matching word or mouth shape (a match cut) so the two takes read as a single performance.",
        why: "The brain stitches shots together when composition and motion match at the cut point. A shared word with a hard consonant gives you both an audio anchor and a matching mouth position.",
        steps: [
          "Find a word both takes share — ideally starting with a hard consonant (b, p, t, k).",
          "Cut take A just before the word and take B right at it; align the waveforms so the consonant hits identically.",
          "Check the mouth shape and head position match; if slightly off, add a 2–3 frame punch-in on take B to justify the change.",
          "Smooth any audio difference with a short crossfade (2–4 frames) on the audio only.",
        ],
        pitfall: "Don't cut between takes with different energy or room tone — the voice mismatch betrays the splice even when the picture is perfect.",
      },
      {
        title: "Dead pause mid-answer",
        situation: "There's a 4-second silent gap in the middle of an otherwise good answer.",
        approach: "Ripple-trim the gap to close it — or, if the pause is meaningful, bridge it with a cutaway instead of leaving dead air.",
        why: "Silence with a static face reads as an error and kills momentum. But not every pause is waste — a pause after a heavy statement is emotion. The skill is telling the two apart.",
        steps: [
          "Ask first: is this pause dead air or a dramatic beat? If the previous line was emotional, keep 1–1.5 seconds of it.",
          "For dead air: ripple-delete the gap, then check the resulting jump cut.",
          "If the jump is visible, cover it with a cutaway or a subtle 3–5% punch-in on one side.",
          "Lay room tone under the joint so the background noise doesn't 'click' at the cut.",
        ],
        pitfall: "Closing every pause to zero makes speech inhuman. Leave a beat of air after important sentences — the viewer needs time to absorb them.",
      },
      {
        title: "Action cut looks jumpy",
        situation: "Cutting between two shots of the same movement (sitting down, opening a laptop) looks off.",
        approach: "Cut in the middle of the action and match motion direction and speed across the cut so the eye carries over it.",
        why: "The eye locks onto moving objects. If the motion continues seamlessly across the cut — same direction, same speed, same screen position — the viewer tracks the motion instead of noticing the edit.",
        steps: [
          "Find the peak of the movement (hand halfway to the desk, body halfway down).",
          "Cut the outgoing shot at that midpoint, and the incoming shot a hair AFTER the same point — 1–2 overlapping frames feel smoother than a perfect match.",
          "Confirm the motion travels the same screen direction in both shots.",
          "Play at full speed — judge action cuts at speed, never frame-by-frame.",
        ],
        pitfall: "Don't cut at the start or end of the movement — stillness on either side of the cut is exactly what makes it jumpy.",
      },
      {
        title: "Only a static talking head",
        situation: "The client gave you one locked-off talking-head shot and nothing else.",
        approach: "Create visual cuts with subtle punch-ins (a small scale-up) on each new point, so the frame changes even without extra footage.",
        why: "A punch-in simulates a second camera. Because the composition changes at each cut, the viewer's eye gets the 'new shot' reset it craves — no b-roll needed.",
        steps: [
          "Mark every topic change or emphasized sentence in the clip.",
          "Alternate between 100% and roughly 115–125% scale at those marks — always cut, never zoom drift, for a two-camera feel.",
          "Keep the eyes in the same third of the frame at both sizes so the jump feels intentional.",
          "If the footage is 4K in a 1080 timeline, you have punch-in room with zero quality loss.",
        ],
        pitfall: "Punching in on random words (instead of topic changes) makes the rhythm feel arbitrary — the cut must land where the CONTENT shifts.",
      },
    ],
  },

  /* ── Week 2 ─────────────────────────────────────────────── */
  {
    week: 2,
    title: "Pacing & rhythm",
    summary: "Control energy with shot length, silence, and cutting to rhythm.",
    overview:
      "Pacing is the heartbeat of an edit — it tells the viewer how to feel before they consciously register anything. Fast cuts create urgency and energy; held shots create weight and importance. Neither is 'better': pace is a dial you turn deliberately, moment by moment, to match what the content is doing.\n\nThe professional skill is reading the energy curve of your material — where it naturally rises, where it sags — and then shaping shot length, music and silence to amplify the peaks and rescue the valleys. Retention graphs made this measurable: every drop-off is a pacing decision you can fix. This week you learn to hear the rhythm of an edit the way a musician hears a beat.",
    goal: "By the end of this week you can cut a montage that locks to music and diagnose exactly where — and why — a flat edit loses its audience.",
    lessons: [
      {
        heading: "Reading the energy curve",
        body:
          "Every piece of content has a natural energy shape: a strong opening, a sag in the middle, a build to the payoff. Before you cut anything, watch the raw footage and sketch that curve — literally note where it peaks and dips. Your edit's job is to compress the dips and expand the peaks. Retention data confirms the pattern: audiences leave during transitions, tangents and repeated points, not during peaks. Once you can see the curve, every pacing decision becomes obvious: tighten here, breathe there, interrupt before the sag.",
        points: [
          "Map the energy of the raw footage BEFORE cutting — peaks, sags, payoffs.",
          "Audiences drop during tangents and repetition, almost never during peaks.",
          "Compress valleys ruthlessly; let peaks breathe.",
          "A 'pacing problem' is usually a structure problem wearing a disguise.",
        ],
      },
      {
        heading: "Shot length is a language",
        body:
          "The duration of a shot tells the viewer how important it is. A 10-frame shot says 'glance at this'; a 6-second hold says 'this matters — sit with it.' Editors get in trouble when every shot is the same length: uniform duration creates a flatline no content can survive. Vary shot length the way a writer varies sentence length — short-short-long creates rhythm; monotony creates sleep. And remember that silence is a duration too: a beat of quiet after a loud sequence hits harder than any sound effect.",
        points: [
          "Shot duration = perceived importance. Hold what matters, flash what doesn't.",
          "Vary lengths like sentence structure: short, short, long.",
          "Silence after intensity is a power move — don't fear a beat of quiet.",
          "If every shot is 2 seconds, NOTHING feels important.",
        ],
      },
      {
        heading: "Cutting to music & pattern interrupts",
        body:
          "Music gives your edit a metronome. Cutting on the downbeat feels locked and satisfying; cutting just off the beat creates tension you can resolve later. But don't become the editor who cuts on every single beat — that's a flipbook, not a rhythm. Pick the strong beats (usually the 1, sometimes the 1 and 3) and let shots ride across the others. In short-form, add pattern interrupts — a zoom, an SFX hit, a cutaway, a text pop — roughly every 7–10 seconds. Each interrupt resets the viewer's attention clock. The rule: every interrupt must be motivated by the content, or it reads as noise.",
        points: [
          "Mark the beats first (M on the timeline), then cut TO the marks.",
          "Cut on strong beats only — riding across weak beats creates flow.",
          "Pattern interrupt every 7–10s in short-form: zoom, SFX, b-roll, text.",
          "Every interrupt must be motivated by what's being said — never random.",
        ],
      },
    ],
    practice: "Cut a 30-second montage to the beat of a track — then recut the SAME footage to a track with completely different energy and study how the meaning changes.",
    watch: "High-retention edits (top Shorts/Reels in your niche) — count how long each shot holds and note what happens every 7–10 seconds.",
    learn: "Energy curves, shot-length variation, cutting on the beat, pattern interrupts, retention-graph reading.",
    drill: [
      "Choose a 60–90 second track with a clear beat and drop markers on every downbeat.",
      "Cut a montage where every cut lands on a marked beat. Watch it — locked but predictable?",
      "Recut so only 60% of cuts land on the beat: hold some shots across two beats, snap others early.",
      "Add one deliberate silence: kill the music for one beat before the best moment, then slam back in.",
      "Compare all three versions — the third will feel the most professional. Understand why.",
    ],
    takeaways: [
      "Pace is a deliberate dial, not a side effect of trimming.",
      "Uniform shot length is the silent killer of retention.",
      "Cut to the strong beats; ride across the weak ones.",
      "Attention needs a reset every 7–10 seconds in short-form — motivated, not random.",
    ],
    scenarios: [
      {
        title: "Sagging middle",
        situation: "Retention dips hard around the 40% mark of your video.",
        approach: "Shorten shots, cut tangents, and add a pattern interrupt (zoom, SFX, or b-roll) every 7–10 seconds to reset attention.",
        why: "Mid-video sag is almost always accumulated slack: slightly-too-long shots and half-relevant tangents that each cost a little attention until viewers quit. Interrupts restart the attention clock before it runs out.",
        steps: [
          "Open the retention graph and mark the exact timestamps where the slope steepens.",
          "Watch 15 seconds before each drop — the CAUSE is usually just before the effect.",
          "Cut or tighten whatever precedes the drop (tangent, repetition, slow transition).",
          "Insert an interrupt at each former drop point: punch-in, b-roll, text pop, or an SFX-marked beat change.",
        ],
        pitfall: "Don't just speed everything up globally — blanket tightening flattens the peaks too. Fix the specific drop points.",
      },
      {
        title: "Montage to music",
        situation: "You need an energetic progress montage set to a track.",
        approach: "Mark the beats, cut on the downbeat, and match shot length to the track's energy — quicker in the chorus, longer in the verse.",
        why: "Music sets the viewer's internal clock. When cuts confirm the beat their brain already predicted, the montage feels 'locked' — and shot length that mirrors the track's energy makes the music and picture feel authored together.",
        steps: [
          "Lay the track first. Tap markers on every downbeat, and flag the drop/chorus sections.",
          "Assign footage by energy: peaks of action on the chorus, setup shots on the verse.",
          "Cut verse shots at 2–4 beats long, chorus shots at 1–2 beats.",
          "On the biggest drop, do something different: a speed ramp, a held shot, or a flurry of 3 one-beat cuts.",
        ],
        pitfall: "Cutting on EVERY beat for the whole montage. It's exhausting — save the fastest cutting for the chorus so it has somewhere to go.",
      },
      {
        title: "Emotional beat rushed",
        situation: "A heartfelt line gets cut away from too quickly and doesn't land.",
        approach: "Hold the shot a beat longer and add a breath of silence so the moment lands before you cut.",
        why: "Emotion needs processing time. The viewer's feeling peaks a beat AFTER the words end — cut during that beat and you amputate the emotion at its highest point.",
        steps: [
          "Extend the shot 1–2 seconds past the end of the line — keep the speaker's face as the emotion settles.",
          "Duck or pause the music under the line so nothing competes with it.",
          "Resume music (or cut) only after the emotional beat completes — watch the speaker's eyes; they'll tell you when.",
          "Consider an L-cut: let the silence carry over the next shot so the mood bridges forward.",
        ],
        pitfall: "Adding sad music ON the line to force the emotion. Trust the moment — the silence is what makes it land.",
      },
      {
        title: "Energy cliff after the hook",
        situation: "A punchy intro drops into a flat body and viewers bail at the transition.",
        approach: "Carry momentum with motivated movement and slightly quicker cuts; don't let the pace fall off a cliff once the hook ends.",
        why: "Viewers calibrate their expectations to your hook's energy. A hard downshift feels like a bait-and-switch — the drop in pace registers as a drop in quality.",
        steps: [
          "Overlap the seam: start the body's first sentence as a J-cut under the hook's final frames.",
          "Keep the first 15 seconds of the body cut at ~80% of the hook's pace, then ease down gradually.",
          "Add motion at the transition — a walking shot, a whip to b-roll — so movement bridges the energy gap.",
          "Never put your slowest content (long context, disclaimers) directly after the hook; feed context in later, in pieces.",
        ],
        pitfall: "Solving it by making the hook slower 'to match'. Never dull the hook — raise the floor of the body instead.",
      },
      {
        title: "Podcast clip drags",
        situation: "A talking clip feels slow and loses people even though the content is good.",
        approach: "Tighten by removing filler and pauses, and cut to a reaction or cutaway on the punchline for a beat of rhythm.",
        why: "Spoken conversation runs at thinking speed, not watching speed. Removing the 'ums' and dead pauses raises the idea-density per second — and a reaction shot on the punchline gives the viewer a cue for how to feel.",
        steps: [
          "Strip filler words and false starts first (a text-based editor makes this fast).",
          "Tighten inter-sentence gaps to 2–5 frames, keeping full breaths only before big statements.",
          "Cut to the listener's reaction right ON the punchline — their expression amplifies it.",
          "Add tight captions; word-by-word timing adds visual rhythm that masks remaining slow patches.",
        ],
        pitfall: "Over-tightening until the speaker sounds robotic. Preserve their natural cadence on the key sentences — those need to sound human.",
      },
    ],
  },

  /* ── Week 3 ─────────────────────────────────────────────── */
  {
    week: 3,
    title: "Hooks (first 3 seconds)",
    summary: "Open with a curiosity gap or a bold promise — instantly.",
    overview:
      "The first three seconds decide whether anyone watches the next thirty. On a feed, your video isn't competing with other videos — it's competing with the swipe, a reflex that fires in about a second and a half. A hook must interrupt that reflex with one of two forces: curiosity (an open question the brain itches to close) or a promise (a specific payoff worth staying for).\n\nGreat hooks are engineered, not found. They stack three channels at once — what the viewer sees (motion, a striking frame), what they hear (a bold first line), and what they read (text that adds tension rather than repeating the audio). This week you learn the formats that consistently stop the scroll and, just as important, how to edit the hook so its energy doesn't collapse the moment it ends.",
    goal: "By the end of this week you can take any video and build five different hooks for it — and pick the right one for the platform.",
    lessons: [
      {
        heading: "Anatomy of a hook: three channels, one job",
        body:
          "A scroll-stopping hook works on three channels simultaneously. Visual: the first frame must have motion, a face, or something unresolved — static logos and slow fades are scroll-past signals. Verbal: the first sentence must open a loop or make a claim; greetings and context are postponed or deleted. Text: the on-screen line should ADD tension to what's being said, not subtitle it. When all three channels pull in the same direction, the hook feels irresistible; when one contradicts the others (energetic words over a dead frame), the weakest channel wins and the viewer scrolls.",
        points: [
          "Three channels: what they see, hear, and read — all must pull the same direction.",
          "First frame: motion, a face, or something unresolved. Never a logo or fade-in.",
          "First words: a claim or open loop. Delete greetings, names, and setup.",
          "On-screen text adds tension; it never just repeats the audio.",
        ],
      },
      {
        heading: "The five hook formats that work",
        body:
          "Nearly every high-performing hook is one of five shapes. (1) Cold open: start inside the most dramatic moment with zero setup. (2) Teaser-rewind: flash the payoff — 'this is what my kitchen looks like now' — then rewind to the beginning. (3) Bold claim: a specific, slightly confrontational statement the viewer wants to see defended. (4) Open loop: begin a story and withhold the resolution — 'the client's reply changed how I price everything.' (5) Result-first: show the after, then explain the how. Learn to recognize which shape your content wants: tutorials love result-first; stories love open loops; opinions love bold claims.",
        points: [
          "Cold open, teaser-rewind, bold claim, open loop, result-first — learn all five.",
          "Tutorials → result-first. Stories → open loop. Opinions → bold claim.",
          "Specificity is what makes claims credible: '3 years' beats 'a long time'.",
          "Write the hook LAST — you can't tease a payoff until you know what it is.",
        ],
      },
      {
        heading: "Editing the hook: the craft under the copy",
        body:
          "The hook is also an editing job. Cut into the first word — even half a second of pre-roll silence kills momentum. Put motion in the first second: a punch-in, a b-roll swap, a caption pop. Make the audio hit immediately, with the music already at full energy rather than fading in. And check the frame the platform actually shows first: your cover frame and your first playing frame are both hooks. Finally, engineer the hook-to-body seam (Week 2's energy cliff): tease enough that staying feels mandatory, but never promise what the video doesn't deliver — a misleading hook trades one view now for distrust forever.",
        points: [
          "Cut into the first word — zero pre-roll, zero fade-in.",
          "Motion within the first second: punch-in, caption pop, or b-roll swap.",
          "Music enters at full energy; never fade in during a hook.",
          "The hook must be honest — retention data exposes bait instantly.",
        ],
      },
    ],
    practice: "Take one existing video and build five different openings for it — one per format (cold open, teaser-rewind, bold claim, open loop, result-first). Show both to someone and watch which one they stop for.",
    watch: "The top 10 shorts in your niche this month. For each: freeze the first frame, transcribe the first sentence, read the first caption. Name the format.",
    learn: "Open loops, bold claims, curiosity gaps, teaser-then-rewind, cold opens, first-frame design.",
    drill: [
      "Pick a finished video (yours or a client's) whose opening is weak.",
      "Write five hooks for it — one in each format. Force yourself to complete all five even when one feels obviously right.",
      "Cut the best two as real edits: first frame, first line, first caption, music from frame one.",
      "Test on a human: play each and watch their face during seconds 1–3 (not after).",
      "Ship the winner. Note WHY it won — build your personal pattern library.",
    ],
    takeaways: [
      "You have ~1.5 seconds. The hook is the most valuable real estate in the edit.",
      "Curiosity or promise — every working hook runs on one of the two.",
      "Stack all three channels: visual + verbal + text, pulling together.",
      "An honest hook builds a channel; a bait hook burns one.",
    ],
    scenarios: [
      {
        title: "Slow intro (“Hi guys…”)",
        situation: "The video opens with a greeting, a name, and a minute of setup before anything interesting.",
        approach: "Delete the greeting entirely; open on the single most surprising line or result.",
        why: "Greetings carry zero information and burn the only seconds where attention is guaranteed. The strongest moment of the video earns more attention as second 1 than as minute 4 — nobody needs context to feel intrigue.",
        steps: [
          "Scrub the whole video and find the most surprising sentence, visual, or result — wherever it is.",
          "Cut it into position as the very first shot, trimmed to start ON the first word.",
          "Bridge back to the natural start with one line of text or VO ('here's how I got there').",
          "Delete the greeting completely — don't move it later; it adds nothing anywhere.",
        ],
        pitfall: "Keeping a 'short' greeting as a compromise. Two seconds of 'hey everyone, welcome back' is two seconds of viewers leaving.",
      },
      {
        title: "Buried payoff",
        situation: "The best moment of the video happens at 0:40 and everything before it is buildup.",
        approach: "Cold-open with a teaser of that payoff, then rewind — “here's how I got there.”",
        why: "A tease converts your best moment into an open loop: viewers now WANT the buildup because they know where it leads. The same 40 seconds that felt slow becomes anticipation.",
        steps: [
          "Clip 2–3 seconds of the payoff — enough to intrigue, not enough to satisfy.",
          "Place it at frame zero, then hard-cut to the beginning (a rewind SFX or whip transition sells the jump).",
          "Add one caption over the tease that frames the stakes ('this took 3 attempts').",
          "When the payoff arrives for real, let it run longer than the tease did — the full version must out-deliver the preview.",
        ],
        pitfall: "Teasing with the ENTIRE payoff. If the tease resolves the curiosity, there's no reason to stay — always hold back the best part.",
      },
      {
        title: "No visual hook",
        situation: "The opening line is verbally strong but the picture is a static, boring frame.",
        approach: "Pair the line with motion, bold text, or a striking b-roll frame within the first second.",
        why: "The feed is silent-by-default on many platforms and purely visual for the first instant. A dead frame reads as a dead video, no matter what's being said — the visual channel vetoes the verbal one.",
        steps: [
          "Add an immediate punch-in or scale animation on the speaker in the first 15 frames.",
          "Pop the key phrase on screen word-by-word, timed to the audio.",
          "If you have b-roll of the subject, open on its most dynamic frame instead of the talking head.",
          "Check the video's cover/first frame on the platform — make sure THAT frame is also strong.",
        ],
        pitfall: "Motion for motion's sake — random zooms and shake effects unrelated to the words read as desperation, not energy.",
      },
      {
        title: "Weak, generic claim",
        situation: "The hook is vague — “let's talk about focus” — and nobody stops for it.",
        approach: "Make it specific and stakes-driven: “I wasted 3 years ignoring this one habit.”",
        why: "Specificity is credibility. Numbers, timeframes and named consequences signal a real story with real stakes; vague topics signal a lecture. 'Focus' is a category — '3 wasted years' is a confession.",
        steps: [
          "Take the generic topic and ask: what did it COST or GAIN, in numbers? (years, dollars, subscribers, attempts)",
          "Rewrite the line around that number and a first-person stake.",
          "Sharpen with contrast if possible: 'everyone says X — it cost me three years of believing it.'",
          "Put the number in the on-screen text too; digits stop eyes.",
        ],
        pitfall: "Inventing stakes you can't back up. The video must actually cash the claim — a hook the content can't support is just clickbait with extra steps.",
      },
      {
        title: "Question hook falls flat",
        situation: "The video opens with a yes/no question and viewers scroll right past it.",
        approach: "Replace it with an open loop the viewer must resolve, not a question they can answer and scroll past.",
        why: "A yes/no question closes instantly — the viewer answers it in their head and moves on. An open loop can't be self-resolved: the only way to close it is to keep watching.",
        steps: [
          "Identify what the question was really about ('do you struggle to focus?' → focus habits).",
          "Convert it to an unresolved statement: 'the reason you can't focus has nothing to do with discipline.'",
          "Withhold the answer through the first section — tease its shape ('and it takes 30 seconds to fix') before revealing it.",
          "Pay the loop off explicitly later, and mark the payoff visually so skimmers can feel it land.",
        ],
        pitfall: "Opening loop after loop without closing any. Unresolved loops feel like scam structure — every loop you open is a debt you must pay.",
      },
    ],
  },

  /* ── Week 4 ─────────────────────────────────────────────── */
  {
    week: 4,
    title: "B-roll & coverage",
    summary: "Choose visuals that represent the idea and cover the whole edit.",
    overview:
      "B-roll advances meaning and hides cuts — it's never just filler. Every b-roll clip you place makes a claim: 'this is what those words look like.' When the claim is right, the viewer understands faster and feels more; when it's lazy (generic stock of people high-fiving in a meeting room), the viewer's trust in the whole edit erodes.\n\nThe two skills of this week: selection and timing. Selection means knowing when to be literal (they say 'our office' — show the office) and when to be conceptual (they say 'growth takes time' — show a timelapse, not a bar chart). Timing means landing the visual on the exact words it belongs to, entering and exiting on beats, and building a shot-type variety — wide, medium, close, macro, insert — that keeps the eye fed for an entire edit.",
    goal: "By the end of this week you can fully cover a 3-minute talking-head with b-roll that adds meaning on every single placement.",
    lessons: [
      {
        heading: "Literal vs conceptual: what does this line LOOK like?",
        body:
          "For every line of narration, ask: is this concrete or abstract? Concrete lines (places, objects, actions) want literal coverage — show the thing. Abstract lines (growth, trust, stress, time) can't be filmed directly, so you show a visual metaphor the viewer decodes in half a second: growth = a plant timelapse; pressure = a tightening clamp; scale = a drone pulling wider and wider. Conceptual b-roll is where editors show taste — the metaphor should feel discovered, not clichéd. The moment a metaphor becomes a default (lightbulb = idea), find the second-best option instead; freshness is the point.",
        points: [
          "Concrete line → literal shot. Abstract line → visual metaphor.",
          "A good metaphor decodes in under a second — if it needs explaining, it fails.",
          "Skip the first cliché that comes to mind (lightbulb, handshake); use your second idea.",
          "The b-roll makes a claim about the words — make sure it's the right claim.",
        ],
      },
      {
        heading: "The shot-type taxonomy & coverage planning",
        body:
          "Variety is engineered with a taxonomy: wide (establishes place), medium (shows action), close-up (shows emotion or detail), macro/insert (shows texture — hands, screens, objects), POV (puts the viewer in the body), and movement shots (dolly, pan, drone — add kinetic energy). A sequence that stays in one shot type flatlines no matter how good each clip is. Plan coverage like a shooter even when you're only editing: for each section of narration, aim to alternate at least three types. When sourcing stock, search by shot type too ('macro coffee pour', 'aerial city night'), not just subject.",
        points: [
          "Six types: wide, medium, close, macro/insert, POV, movement.",
          "Alternate at least three types per sequence — never two wides back to back.",
          "Search stock by TYPE + subject, not subject alone.",
          "Movement shots inject energy exactly where pacing sags.",
        ],
      },
      {
        heading: "Timing: land the visual on the word",
        body:
          "B-roll timing follows one rule: the visual should confirm the words as they're spoken — arriving on the word or a few frames before it, never seconds late. Enter and exit on beats: start the b-roll on the phrase it illustrates and return to the speaker for the sentences that carry personal weight (eye contact is a resource; spend it on the important lines). Avoid wallpapering — covering 100% of the A-roll signals that the speaker doesn't matter. A good rhythm for most content: show the speaker for the setup, b-roll through the explanation, back to the face for the conclusion.",
        points: [
          "Land b-roll ON the matching word, or 2–5 frames early. Late = disconnected.",
          "Return to the speaker's face for the emotionally important lines.",
          "Never wallpaper 100% — the face is where trust lives.",
          "Enter/exit b-roll on audio beats so the cuts inherit the rhythm.",
        ],
      },
    ],
    practice: "Cover a full 3-minute talking head using only b-roll and punch-ins — every placement must earn its spot by adding meaning, not just motion.",
    watch: "Conceptual b-roll masters (video essays, high-end brand docs) — pause on abstract lines and study what visual they chose and why it works.",
    learn: "Literal vs conceptual selection, the six shot types, coverage planning, b-roll timing, when to show the speaker.",
    drill: [
      "Take a 3-minute talking-head clip and print/paste its transcript.",
      "Mark every line C (concrete) or A (abstract) in the margin.",
      "For each C, source a literal shot; for each A, brainstorm two metaphors and pick the fresher one.",
      "Place everything with the on-the-word timing rule; alternate shot types deliberately.",
      "Review pass: for every placement ask 'does this ADD meaning?' Delete any clip that's only motion.",
    ],
    takeaways: [
      "B-roll is an argument about what the words mean — never decoration.",
      "Abstract ideas need metaphors, and the second metaphor you think of beats the first.",
      "Variety is engineered through shot types, not luck.",
      "Timing on the word is what makes b-roll feel authored.",
    ],
    scenarios: [
      {
        title: "Repetitive stock",
        situation: "Everything feels same-y — the b-roll is technically relevant but visually monotonous.",
        approach: "Mix wide, medium, and close-up; never reuse the same clip; vary angle and subject across the sequence.",
        why: "The eye habituates to sameness within seconds. Even perfectly relevant clips stop registering when they share the same framing, palette and energy — variety is what keeps the visual channel awake.",
        steps: [
          "Audit the sequence and label every clip's shot type — the problem is usually five mediums in a row.",
          "Re-source so consecutive clips alternate types (wide → close → movement → medium).",
          "Vary the palette and setting too: if three clips are all blue-ish offices, swap one for warm or outdoor.",
          "Ban clip reuse within one video; a repeated clip reads as 'the editor gave up'.",
        ],
        pitfall: "Fixing monotony by adding effects (zooms, overlays) to the same clips — the problem is the footage variety, not the decoration.",
      },
      {
        title: "Abstract line",
        situation: "The script says “growth takes time” and you have no idea what to show.",
        approach: "Use conceptual b-roll — a plant growing, a timelapse, calendar pages flipping — instead of a literal chart.",
        why: "Abstract nouns can't be photographed, but their FEELING can. A timelapse doesn't depict growth statistics; it makes the viewer feel duration and change — which is what the line is actually about.",
        steps: [
          "Extract the core concept from the line (here: slow change over time).",
          "Brainstorm three metaphors fast: seedling timelapse, city construction, seasons changing on one street.",
          "Reject the cliché (seedling is the stock-iest) and pick the one that fits the video's world.",
          "Time it so the metaphor's 'reveal' (the plant at full height, the building done) lands on the end of the sentence.",
        ],
        pitfall: "Stacking a metaphor on EVERY abstract line — conceptual b-roll is a spice. Back-to-back metaphors turn the video into a riddle.",
      },
      {
        title: "Covering a jump cut",
        situation: "There's a visible jump in the interview and no second camera angle.",
        approach: "Lay a relevant cutaway over the cut point so the edit becomes invisible.",
        why: "A cutaway resets the viewer's visual memory. After even one second of looking elsewhere, they can't detect that the speaker's position changed — the jump literally stops existing for them.",
        steps: [
          "Find a cutaway that relates to what's being said AT that moment — relevance keeps immersion.",
          "Start the cutaway 10–20 frames BEFORE the jump and end 10–20 after, so both edit points hide inside it.",
          "Keep the speaker's audio running untouched underneath — continuous audio sells the illusion.",
          "No relevant cutaway? Use a punch-in instead: jump cuts disguised as camera changes.",
        ],
        pitfall: "Using an unrelated cutaway just to hide the cut — viewers subconsciously ask 'why am I seeing this?' and the confusion costs more than the jump did.",
      },
      {
        title: "No b-roll available",
        situation: "You have nothing but the A-roll — no stock budget, no archive, no second shoot.",
        approach: "Use text/motion graphics, punch-ins, or search/generate stock scoped tightly to that beat.",
        why: "Coverage isn't about having footage; it's about giving the eye scheduled changes. Typography, scale changes, and graphic elements are all legitimate 'shots' that reset attention exactly like b-roll does.",
        steps: [
          "Turn the strongest quotes into full-screen typography cards timed to the audio.",
          "Use the Week 1 punch-in system (100% ↔ 120%) on every topic change.",
          "Animate simple graphics for any numbers or steps mentioned — a counter or list builds itself as they talk.",
          "For 2–3 truly critical beats, source free stock (Pexels) or generate imagery — spend effort only where meaning demands it.",
        ],
        pitfall: "Filling gaps with watermarked previews or off-topic freebies. One 'cheap' clip marks the whole edit as cheap — graphics you control always beat footage you don't.",
      },
      {
        title: "B-roll timing",
        situation: "Your b-roll is relevant but feels disconnected from the words.",
        approach: "Land the b-roll slightly before or on the matching narration so it reinforces the point as it's said.",
        why: "Meaning is made by synchronization. The same clip placed two seconds late becomes noise, because the viewer's brain binds picture to the words playing at that exact moment.",
        steps: [
          "Find the exact word each clip illustrates and place the cut ON it (or 2–5 frames early).",
          "Check the exits too: leave the b-roll when its idea ends, not when the clip runs out.",
          "Nudge clips so their internal action (the pour, the click, the reveal) peaks with the sentence's emphasis.",
          "Play the section eyes-closed, then eyes-open: the picture should feel like it's ANSWERING the audio.",
        ],
        pitfall: "Letting clip length dictate timing — trimming narration to fit the b-roll is backwards. The words lead; the picture follows.",
      },
    ],
  },

  /* ── Week 5 ─────────────────────────────────────────────── */
  {
    week: 5,
    title: "Storytelling structure",
    summary: "Find and shape the story in raw footage: setup, tension, payoff.",
    overview:
      "Even a 30-second clip is a story. Setup → tension → payoff is the shape attention wants: establish something the viewer cares about, complicate it, resolve it. Content that 'just presents information' leaks viewers at every moment, because there's no unanswered question holding them; content with a story spine holds attention through slow sections, because the viewer has an investment they need to see paid.\n\nThe editor is usually the person who FINDS this story: it arrives buried in 45 minutes of rambling footage, out of order, mixed with dead ends. This week you learn the professional workflow for that discovery — selects, paper edits, the through-line — plus the structural tools (stakes, open loops, callbacks) that turn footage into a story and endings that actually land.",
    goal: "By the end of this week you can take an unstructured 45-minute interview and deliver a 3-minute cut with a spine, rising tension and an ending that pays off.",
    lessons: [
      {
        heading: "The three-act spine (at every scale)",
        body:
          "Setup: who/what/why should I care. Tension: the complication, obstacle or open question. Payoff: the resolution that makes the time spent feel worth it. This shape is fractal — it works at every scale. A 15-second Reel has it (before / attempt / after). A YouTube video has it globally AND inside each section. When an edit 'feels flat', run the diagnostic: is there a setup the viewer cares about? Is something genuinely uncertain in the middle? Does the ending resolve what the beginning opened? Nine times out of ten, flatness is a missing or broken act — most commonly, no real tension.",
        points: [
          "Setup → tension → payoff, at every scale from 15 seconds to 15 minutes.",
          "Flat edit? Diagnose which act is missing. It's usually tension.",
          "Each section of a long video should have its own mini-arc.",
          "The payoff must resolve the SPECIFIC question the setup opened.",
        ],
      },
      {
        heading: "Stakes, open loops & callbacks",
        body:
          "Tension is manufactured from stakes: what happens if this fails? What did it cost? Until consequences are explicit, the viewer has no reason to care about the outcome — 'we almost lost the client' transforms every subsequent scene. Open loops are promised payoffs ('the third mistake is the one that hurt most…') that create forward pull; place them just before your weakest sections, and always pay them off. Callbacks — returning to an earlier image, phrase or joke — are the cheapest structural magic in editing: they make an edit feel designed rather than assembled, and a callback ending is almost always stronger than a summary ending.",
        points: [
          "No stakes, no story. Make the cost of failure explicit and early.",
          "Open loops before weak sections; pay off every loop you open.",
          "Callbacks make edits feel authored — set them up on purpose.",
          "End on a callback or consequence, never on a fade-out summary.",
        ],
      },
      {
        heading: "Finding the story in raw footage",
        body:
          "The professional workflow for rambling footage: (1) Watch everything once WITHOUT cutting, marking moments that make you feel something — surprise, laughter, tension. Those marks are your story candidates. (2) Pull selects into a separate sequence; you've turned 45 minutes into 8. (3) Find the through-line: the one sentence the whole piece argues ('she rebuilt the business by refusing to scale'). Write it on a sticky note. (4) Paper-edit: arrange selects into setup/tension/payoff, ignoring chronology — real chronology is the least interesting order for most stories. (5) Only now start cutting. Every clip that doesn't serve the through-line gets cut, no matter how good it is in isolation.",
        points: [
          "Watch first, cut later — mark every moment that makes you FEEL.",
          "Selects pass: 45 minutes → 8 minutes of candidates.",
          "The through-line is one sentence; write it down and obey it.",
          "Chronology is optional. Emotion order beats time order.",
        ],
      },
    ],
    practice: "Build a 60-second story with a clear setup–tension–payoff from footage that wasn't shot as a story (vlog footage, an interview, event coverage).",
    watch: "Documentary and video-essay openers — note how fast they establish stakes, and where the first open loop lands.",
    learn: "The three-act spine, stakes, open loops, callbacks, selects workflow, paper edits, the through-line.",
    drill: [
      "Take any long unstructured footage (interview, event, vlog day).",
      "Watch it once end-to-end without touching the timeline; mark every moment you feel something.",
      "Write the through-line as one sentence. Tape it to your monitor.",
      "Paper-edit the marked moments into setup → tension → payoff, ignoring the original order.",
      "Cut the 60–90 second version. Then delete one more clip you love that doesn't serve the spine — that's the lesson.",
    ],
    takeaways: [
      "Attention follows unanswered questions — structure is how you plant them.",
      "Stakes first: nothing matters until failure has a cost.",
      "Find the story before you cut; the through-line is your razor.",
      "Kill your darlings: great moments that don't serve the spine weaken it.",
    ],
    scenarios: [
      {
        title: "Rambling interview",
        situation: "45 minutes of unstructured talking with good moments scattered everywhere.",
        approach: "Find the through-line, build setup→conflict→resolution around it, and cut everything that doesn't serve that spine.",
        why: "An interview isn't a story until it argues something. The through-line converts 'a person talking' into a case being made — and gives you an objective rule for every keep/cut decision.",
        steps: [
          "Full watch-through with timestamps on every emotionally alive moment (no cutting yet).",
          "Write the one-sentence through-line the best moments point at.",
          "Pull selects; arrange them as setup (context + stakes), conflict (the struggle), resolution (what changed).",
          "Cut everything else — including good quotes that argue a DIFFERENT through-line. Save them for a second clip.",
        ],
        pitfall: "Trying to keep all the good moments in one edit. Two through-lines in one video = zero stories told.",
      },
      {
        title: "Weak ending",
        situation: "The video just trails off — the content ends and it merely… stops.",
        approach: "End on a callback to the hook or a clear takeaway/CTA so it lands rather than fades.",
        why: "Endings are what viewers remember and what they judge the whole video by (peak-end rule). A callback closes the loop the hook opened, giving the edit a designed, circular feel that a summary can't produce.",
        steps: [
          "Re-read your hook: what question or image did it open?",
          "Find the moment in the footage that answers or mirrors it — that's your final shot.",
          "Cut from the last content beat directly to that ending; delete any 'so yeah, that's basically it' material.",
          "Put the CTA BEFORE the final beat or as text over it — never after the emotional close.",
        ],
        pitfall: "Ending on the CTA itself. 'Like and subscribe' as the final memory cheapens everything before it — close on meaning, not on the ask.",
      },
      {
        title: "No tension",
        situation: "There's nothing pulling the viewer forward — the content is pleasant but skippable.",
        approach: "Make the stakes or consequence explicit early so the outcome actually matters.",
        why: "Viewers don't stay for information; they stay to find out what happens. Stakes convert facts into outcomes that can go wrong — and 'can go wrong' is the engine of watching.",
        steps: [
          "Interrogate the footage for any cost, risk or uncertainty ('we had two weeks before the money ran out').",
          "Move that admission to the first third of the edit, right after the setup.",
          "Frame the middle as attempts against that stake — even a tutorial becomes 'will this work?'",
          "If genuinely nothing is at stake, ask the client/creator one question: 'what would have happened if this failed?' — and build from the answer.",
        ],
        pitfall: "Faking tension with dramatic music over unthreatened content. The audience feels the mismatch, and it reads as manipulation.",
      },
      {
        title: "Montage with no arc",
        situation: "A montage feels like random clips — pretty, but meaningless.",
        approach: "Give it a mini arc — before → process → after — so even the montage tells a story.",
        why: "A montage is a compressed story, not a screensaver. Ordering the same clips as before/struggle/after creates progress the viewer can feel, and progress is what makes a montage satisfying.",
        steps: [
          "Sort your montage clips into three piles: setup (before), effort (process, including failures), result (after).",
          "Order them in that sequence, and make sure at least one 'effort' clip shows struggle — perfection has no arc.",
          "Ramp the pacing: slower/longer at the start, tightest cuts at peak effort, one held shot for the result.",
          "Let the music's build match the arc; the drop belongs to the 'after'.",
        ],
        pitfall: "Only using highlight-reel perfection. Without a visible struggle beat, before→after reads as 'two unrelated photos'.",
      },
      {
        title: "Reorder for impact",
        situation: "The footage is chronological but the result is flat.",
        approach: "Move the most compelling moment earlier as an open loop, then resolve it later.",
        why: "Chronology is how events happened, not how they're best experienced. Pulling the peak forward creates a question ('how did they get HERE?') that powers the viewer through everything that used to feel slow.",
        steps: [
          "Identify the single most gripping moment in the footage, wherever it sits.",
          "Open with 3–5 seconds of it, cut at the moment of maximum uncertainty.",
          "Jump to the chronological start ('48 hours earlier…' — text or VO) and play events forward.",
          "When the timeline catches up to the teased moment, play it in FULL — the payoff must exceed the tease.",
        ],
        pitfall: "Forgetting to re-establish context after the cold open. One orienting line after the tease keeps the time-jump from confusing anyone.",
      },
    ],
  },

  /* ── Week 6 ─────────────────────────────────────────────── */
  {
    week: 6,
    title: "Short-form vs long-form",
    summary: "Repurpose one shoot into platform-native edits.",
    overview:
      "The same footage becomes very different edits depending on where it will live. Short-form (Reels, Shorts, TikTok) is a loop-driven, sound-off-first, 9:16 world where a video earns its next second every second. Long-form (YouTube) is a session-driven world where chapters, promises and pacing arcs manage attention across many minutes. Editing them identically is the most common repurposing mistake — a 'cut-down' is not a short; a short is its own edit with its own hook, arc and captions.\n\nThis week you learn each platform's grammar, then the pipeline that turns one shoot into a family of native pieces: the long cut, multiple verticals, each with an independent hook. This is where editing meets marketing — and where one day of footage becomes two weeks of content.",
    goal: "By the end of this week you can turn one 40-minute recording into a strong long-form cut plus three genuinely native vertical clips.",
    lessons: [
      {
        heading: "Platform grammar: what each format demands",
        body:
          "Short-form rules: total duration under ~60s, a hook in second one, captions always (most viewers are sound-off), a loop if possible (ending that flows back into the beginning rewards rewatches, which the algorithm rewards), and vertical framing designed for a phone held in one hand. Long-form rules: the first 30 seconds carry the click-through promise and must confirm the viewer chose well; chapters create commitment checkpoints; pacing can breathe but every section needs its own mini-arc (Week 5); and end-screens should hand viewers to the next video rather than saying goodbye. Neither is 'easier' — they're different instruments.",
        points: [
          "Short-form: hook at second 1, captions always, loop endings win.",
          "Long-form: first 30s must confirm the thumbnail's promise.",
          "Chapters are commitment devices — name them like mini-hooks.",
          "Retention shapes differ: shorts need per-second wins; long-form needs per-section arcs.",
        ],
      },
      {
        heading: "The repurposing pipeline",
        body:
          "Professionals repurpose in a pipeline, not ad hoc. Step 1: cut the long-form master first — it forces you through all the material and produces your selects. Step 2: while cutting, keep a 'clip candidates' list — every self-contained moment with its own beginning and payoff gets a marker (you'll find 5–15 in a good 40 minutes). Step 3: rank candidates by hook strength, not by how important they were in the long version — short-form success correlates with the first line, not the topic. Step 4: cut each vertical as a NEW edit: its own hook (Week 3), tightened pacing (Week 2), and captions. A clip that merely 'exists in vertical' is not a short.",
        points: [
          "Long-form first — it doubles as your selects pass.",
          "Mark self-contained moments as you cut; aim for 5–15 candidates.",
          "Rank clips by hook strength, not topical importance.",
          "Each vertical is a fresh edit with its own hook — never a crop-and-export.",
        ],
      },
      {
        heading: "Vertical reframing & caption craft",
        body:
          "Going 16:9 → 9:16 is a recomposition, not a crop. Auto-reframe gets you a draft; then fix it shot-by-shot: keep eyes in the top third, ensure gestures stay in frame, and consider stacked layouts (speaker on top, screen recording or b-roll below) when two things matter at once. Captions are a design layer: 2–4 words on screen at a time (word-by-word timing feels most alive), positioned in the safe zone above platform UI, with ONE emphasis technique (color or scale on the key word — not both, not rainbow). Sound-off viewers should get 100% of the meaning; sound-on viewers should never feel the captions shouting over the content.",
        points: [
          "Reframe shot-by-shot; auto-reframe is a draft, not a delivery.",
          "Eyes in the top third; mind the platform UI safe zones.",
          "Captions: 2–4 words at a time, ONE emphasis technique.",
          "Sound-off must carry full meaning; that's the caption bar to clear.",
        ],
      },
    ],
    practice: "Turn one interview into a Reel AND a long cut — then compare their retention shapes after a week and write down one lesson from each.",
    watch: "Creators who repurpose well (podcast clip channels, educator Shorts) — study what they CHANGED between the long and short versions, not just what they kept.",
    learn: "Platform norms, loop endings, the repurposing pipeline, 9:16 recomposition, caption systems, retention-graph shapes.",
    drill: [
      "Take one 20–40 minute recording (podcast, interview, webinar).",
      "Cut the long-form version first, marking every self-contained moment with a colored marker as you go.",
      "List your clip candidates and write a one-line hook for each; kill any candidate whose hook is weak.",
      "Cut the top three as native verticals: new hook, tightened pacing, word-timed captions, reframed shot-by-shot.",
      "Bonus: engineer one clip to loop — make the last line flow into the first and watch the rewatch numbers.",
    ],
    takeaways: [
      "A cut-down is not a short. Every format gets its own edit.",
      "Cut long-form first; it doubles as your selects pass for everything else.",
      "Hook strength — not topic importance — decides which clips work vertical.",
      "Captions and reframing are craft layers, not afterthoughts.",
    ],
    scenarios: [
      {
        title: "Reel from a long interview",
        situation: "You need a 45-second Reel from a 40-minute conversation.",
        approach: "Pull a self-contained moment with its own hook and payoff, then reframe it to 9:16.",
        why: "A Reel viewer has zero context and zero patience for setup. Only a moment that works as a complete story — question, tension, payoff inside 45 seconds — survives being extracted from its parent.",
        steps: [
          "Scan your markers for moments that are complete without ANY surrounding context.",
          "Trim to the tightest version: enter on the most gripping sentence (often mid-story), exit right after the payoff.",
          "Write a new opening caption that does the hook's job for cold viewers.",
          "Reframe shot-by-shot for 9:16, add word-timed captions, and check it sound-off.",
        ],
        pitfall: "Choosing the moment that was most important in context. Out of context it dies — pick the moment that needs no introduction.",
      },
      {
        title: "Long-form retention",
        situation: "A 12-minute video loses a big chunk of viewers midway.",
        approach: "Chapter it, tease upcoming payoffs, and place pattern interrupts at the drop-off points.",
        why: "Long-form viewers constantly renegotiate 'is the rest worth my time?' Chapters and teases keep answering yes by showing what's still coming; interrupts reset attention at the exact moments data says it lapses.",
        steps: [
          "Pull the retention graph and mark every acceleration in the decline.",
          "At each mark, examine the preceding 20 seconds and tighten or cut the cause.",
          "Add a forward-tease just before the worst sag ('the third one is the reason I made this video').",
          "Break the video into named chapters whose titles work as mini-hooks.",
        ],
        pitfall: "Teasing payoffs the video doesn't deliver, or delivering them much later than implied — broken promises show up as cliff-shaped drops at the moment of betrayal.",
      },
      {
        title: "Caption strategy",
        situation: "You're deciding how to caption each format.",
        approach: "Bold, well-timed captions for sound-off short-form; lighter, cleaner captions for long-form.",
        why: "Most short-form plays start muted — captions ARE the audio there, so they must carry full meaning with visual energy. Long-form plays sound-on on bigger screens, where heavy captions compete with the picture instead of helping it.",
        steps: [
          "Short-form: word-by-word or 2–4 word groups, high-contrast, in the safe zone, one emphasis color for key words.",
          "Test every short muted start to finish — if meaning drops anywhere, fix the captions there.",
          "Long-form: proper subtitles (or platform captions) — clean, smaller, no animation.",
          "Keep one consistent caption style per channel; the style is part of the brand.",
        ],
        pitfall: "Rainbow captions with per-word colors and constant bouncing — energy without hierarchy. One emphasis technique, used sparingly, reads better than five used always.",
      },
      {
        title: "Aspect-ratio reframe",
        situation: "Landscape footage needs to go vertical without losing the action.",
        approach: "Auto-reframe to center the key action, then fix framing manually shot by shot.",
        why: "9:16 shows roughly a third of a 16:9 frame — the crop is a new composition decision for every shot. Auto tools track faces adequately, but they don't understand gestures, second subjects or where the viewer needs to look.",
        steps: [
          "Run auto-reframe for a first pass, then review EVERY shot at actual phone size.",
          "Fix shots where gestures, props or a second person fall outside the crop — reposition or keyframe the frame.",
          "Use a stacked layout (speaker top, screen/b-roll bottom) when two elements matter simultaneously.",
          "Check text and graphics from the original — anything baked into the sides needs rebuilding for vertical.",
        ],
        pitfall: "Reviewing the reframe on a desktop monitor at full size. Compositions that look fine at 27 inches fail at 6 — always judge at phone scale.",
      },
      {
        title: "One into many",
        situation: "You want maximum output from a single shoot day.",
        approach: "Slice the long piece into several clips, each with its own distinct hook.",
        why: "Each platform surface is a separate audience — most people who see your Reel never saw the YouTube video. One strong shoot can feed weeks of native content IF each piece stands alone.",
        steps: [
          "From your candidates list, select 4–8 clips covering DIFFERENT angles of the topic — not eight versions of the same point.",
          "Give each clip its own hook, caption set and (where natural) its own title/thumbnail thinking.",
          "Schedule them spaced out, strongest hook first; track which angles outperform.",
          "Route attention: pin a comment or add an end line pointing to the full video.",
        ],
        pitfall: "Publishing eight near-identical clips from the same 3 minutes of the recording. Variety of ANGLE is what makes repurposing feel like content instead of reruns.",
      },
    ],
  },

  /* ── Week 7 ─────────────────────────────────────────────── */
  {
    week: 7,
    title: "Sound & color",
    summary: "Ducking, loudness targets, and a clean, simple grade.",
    overview:
      "Audio is half the edit — and the half viewers judge first. People will forgive soft focus and average framing, but they close the tab on harsh, uneven or muddy sound within seconds. The professional baseline is boring and learnable: clear dialogue at a consistent loudness, music that supports without competing, and transitions that don't click or pop.\n\nColor comes second in priority and second in workflow: correct first (make it accurate), grade after (make it feel). Most YouTube-level footage needs only that — honest correction plus a restrained look. This week you learn the numbers (−16 LUFS, ducking depths), the order of operations, and the scope-driven habits that make your work consistent instead of lucky.",
    goal: "By the end of this week you can deliver a mix where dialogue sits at target loudness with music ducking cleanly under it, and a grade that's consistent across every shot.",
    lessons: [
      {
        heading: "Dialogue first: the mix hierarchy",
        body:
          "Everything in the mix serves the dialogue. Set the voice first: clean it (noise reduction, gentle EQ — cut the mud around 200–400 Hz, add a touch of presence around 3–5 kHz), compress lightly so quiet words survive, and land it around −16 LUFS integrated for online delivery. Then bring music UNDER it: start the bed 10–15 dB below the voice and duck a further ~6–12 dB whenever speech plays — automated ducking gets you close, but ride the automation by ear on the moments that matter. SFX sit between: audible, never startling. If a viewer ever reaches for their volume knob, the mix has failed.",
        points: [
          "Order: dialogue → music → SFX. The voice is the boss.",
          "Dialogue target: about −16 LUFS integrated for online platforms.",
          "Duck music 6–12 dB under speech; automate, then ride by ear.",
          "EQ the voice: cut 200–400 Hz mud, lift 3–5 kHz presence, gently.",
        ],
      },
      {
        heading: "Sound design & the invisible layer",
        body:
          "The difference between amateur and professional edits is often what you HEAR at the cuts. Room tone — the ambient 'silence' of the location — must run continuously under dialogue edits, or every cut pops as the background noise jumps. Crossfade every audio edit, even 2–3 frames. Then the additive layer: whooshes on fast motion, subtle risers into reveals, ambient beds that place the viewer in a space. The discipline is restraint — sound effects should be felt, not noticed. When someone praises 'how smooth' an edit feels, they're usually praising sound design they can't hear.",
        points: [
          "Room tone under every dialogue edit — silence that isn't silent.",
          "Crossfade every audio cut, even a few frames.",
          "SFX are felt, not noticed: whooshes and risers at low levels.",
          "De-ess and de-noise before any creative processing.",
        ],
      },
      {
        heading: "Correct first, grade second",
        body:
          "The two-stage rule keeps color work sane. Stage one, correction: fix white balance (skin and whites look neutral), set exposure using the waveform (skin tones typically around 60–70 IRE), and match every shot to your reference shot using scopes — the vectorscope's skin-tone line doesn't lie, your adapted eyes do. Stage two, grade: apply the look — a LUT at reduced intensity (30–60%), or your own contrast curve and split-toning. Grade AFTER correction so one look sits on a consistent base, and grade gently: if viewers notice the color before the content, you've overgraded. Consistency across shots beats beauty on any single shot.",
        points: [
          "Two stages, always in order: correction (accurate) → grade (feel).",
          "Trust scopes over eyes: waveform for exposure, vectorscope for skin.",
          "LUTs are starting points — dial them to 30–60% and adjust per shot.",
          "Consistency across the cut beats a gorgeous single frame.",
        ],
      },
    ],
    practice: "Take a dialogue scene with music: duck the bed under the VO properly, land dialogue at −16 LUFS, then correct and grade the picture in two distinct passes.",
    watch: "Sound-design breakdowns and grading before/afters — listen to cuts with your eyes closed; look at grades with the sound off.",
    learn: "−16 LUFS, ducking depth, room tone, crossfades, EQ basics, waveform/vectorscope reading, correction vs grade, LUT restraint.",
    drill: [
      "Load a 2-minute dialogue-plus-music sequence.",
      "Mix pass: clean the voice (denoise, de-ess, EQ), compress lightly, set dialogue to −16 LUFS.",
      "Duck the music with automation, then ride it by ear around the important lines.",
      "Lay room tone under every dialogue edit and crossfade every audio cut. Listen eyes-closed for pops.",
      "Color pass: correct every shot to a reference using scopes, THEN apply one look at ~50% and fine-tune per shot.",
    ],
    takeaways: [
      "Viewers forgive average picture; they never forgive bad audio.",
      "Dialogue is the boss track — everything else makes room for it.",
      "Room tone and crossfades are the invisible glue of professional sound.",
      "Correct, then grade — and trust the scopes over your tired eyes.",
    ],
    scenarios: [
      {
        title: "Music drowns dialogue",
        situation: "The track fights the voiceover and viewers strain to follow the words.",
        approach: "Duck music ~12 dB under speech and keep dialogue around −16 LUFS so words stay clear.",
        why: "Speech and full-range music occupy overlapping frequencies — at similar levels the brain has to fight for the words. Ducking creates the level separation that lets both exist.",
        steps: [
          "Set dialogue level first: −16 LUFS integrated, checked with a loudness meter, not faders alone.",
          "Apply ducking (sidechain or auto-duck) so the bed drops 6–12 dB whenever speech plays, with ~200–400 ms release so it swells back naturally.",
          "If the track still fights, EQ a small dip in the music around 2–4 kHz — the voice's clarity range.",
          "Ride the automation manually around whispered or emotional lines.",
        ],
        pitfall: "Choosing music with prominent vocals under spoken dialogue. Two voices can't share the mix — instrumental beds under speech, almost always.",
      },
      {
        title: "Inconsistent loudness",
        situation: "Volume jumps between clips and scenes; viewers keep adjusting.",
        approach: "Normalize to a target loudness and ride levels so the whole piece sits even.",
        why: "Perceived loudness (LUFS) is what viewers experience, and platforms normalize to it anyway. A consistent internal mix means YOUR balance survives platform processing instead of being distorted by it.",
        steps: [
          "Loudness-normalize all dialogue clips to a common target as a starting pass.",
          "Listen through and ride the remaining differences — normalization can't hear emphasis or intent.",
          "Set the overall master to about −16 LUFS integrated with true peaks under −1.5 dBTP.",
          "Full playback in one sitting, hands off the volume — any reach for the knob marks a fix point.",
        ],
        pitfall: "Peak-normalizing instead of loudness-normalizing. Identical peaks can sound wildly different in loudness — LUFS is the measure that matches human ears.",
      },
      {
        title: "Flat footage",
        situation: "The image looks dull and grey out of camera.",
        approach: "Correct exposure and white balance first, then add a gentle creative grade or LUT.",
        why: "Flat/log footage is a container for information, not a finished image. Correction unlocks the data; grading gives it intent. Skipping correction and slapping a LUT bakes the flatness INTO the look.",
        steps: [
          "If it's log footage, apply the correct conversion LUT for that camera profile first.",
          "Set white balance until skin and neutrals read true on the vectorscope.",
          "Set exposure on the waveform: full range used, skin around 60–70 IRE, nothing clipped.",
          "NOW add the creative look at reduced intensity and adjust contrast to taste.",
        ],
        pitfall: "Grading shot one and copying blindly to the rest. Correct each shot to a matched base first — a look applied over mismatched bases makes every difference MORE visible.",
      },
      {
        title: "Mismatched shots",
        situation: "Two cameras (or two days) don't match and every cut between them is jarring.",
        approach: "Match them using scopes (waveform/vectorscope), not just your eye, then fine-tune.",
        why: "Eyes adapt within seconds and lie about color; scopes measure it. Cuts between mismatched shots read as quality drops even to viewers who can't articulate what changed.",
        steps: [
          "Pick the better-looking camera as reference; put both shots side by side.",
          "Match exposure first on the waveform (levels), then white balance on the vectorscope (hue).",
          "Match saturation intensity last; nudge the weaker camera toward the reference — not both toward the middle.",
          "Verify by intercutting the shots and watching skin tones — faces are where mismatch is most visible.",
        ],
        pitfall: "Matching via the creative grade. Match at the CORRECTION stage so one look sits identically on both cameras.",
      },
      {
        title: "Harsh audio",
        situation: "The voice is sibilant, hissy, and fatiguing to listen to.",
        approach: "De-ess, apply noise reduction, and lay room tone under cuts so silence doesn't pop.",
        why: "Harshness compounds: hiss + sharp esses + popping edits each add fatigue, and fatigue is why people leave without knowing why. Each problem has a dedicated, ordered fix.",
        steps: [
          "Noise reduction first, gently — sample the noise profile, remove just enough that hiss stops registering.",
          "De-ess to tame the 5–8 kHz sibilance range on 's' and 't' sounds.",
          "EQ: high-pass below ~80 Hz for rumble; small cut where remaining harshness lives (often 3–6 kHz).",
          "Lay continuous room tone under all dialogue edits and crossfade every joint.",
        ],
        pitfall: "Maxing the noise reduction. Overprocessed 'underwater' voice is worse than mild hiss — remove 70% of the problem and stop.",
      },
    ],
  },

  /* ── Week 8 ─────────────────────────────────────────────── */
  {
    week: 8,
    title: "Client work & delivery",
    summary: "Briefs, revisions, naming, and delivering to spec.",
    overview:
      "Great editors are reliable, not just talented. Clients rehire the editor whose work arrives on time, to spec, with feedback handled gracefully — talent is assumed; professionalism is what's rare. That professionalism is a learnable system, not a personality trait: interrogate the brief before touching the timeline, structure revisions into rounds, keep files findable by anyone, and deliver exactly what each platform needs.\n\nThis final week turns your craft into a business asset. You'll learn the questions that prevent 80% of revisions before they happen, the round-based feedback system that keeps projects profitable, and the delivery habits — specs, naming, archiving — that make clients describe you with the highest compliment in the industry: 'easy to work with.'",
    goal: "By the end of this week you have a reusable client system: a brief checklist, a revision policy, a naming convention, and a delivery spec sheet.",
    lessons: [
      {
        heading: "Interrogating the brief",
        body:
          "Most 'bad client feedback' is a bad brief that was never challenged. Before cutting, get answers to: WHO is this for (audience + platform)? WHAT should a viewer do or feel after watching? WHICH references does the client love — and, just as useful, hate? WHAT are the hard constraints (length, brand rules, mandatory shots, deadline)? WHO has final approval? That last one quietly kills projects: three rounds with a marketing manager mean nothing if the CEO sees it last with fresh opinions. Write the answers back to the client in a one-paragraph summary and get a 'yes' — that paragraph becomes the referee for every later disagreement.",
        points: [
          "Five questions: audience, outcome, references (love AND hate), constraints, final approver.",
          "References beat adjectives — 'make it pop' means nothing; a linked video means everything.",
          "Confirm the brief back in writing; that summary referees future disputes.",
          "Find the real decision-maker before round one, not after round three.",
        ],
      },
      {
        heading: "Revisions without scope creep",
        body:
          "Feedback is where projects become profitable or endless — the difference is structure. Define rounds up front (commonly two included, extras billed): a round is ONE consolidated batch of feedback from ALL stakeholders, not a trickle of messages. When notes arrive vague ('it drags'), translate them into editable instructions ('tighten section 2, especially 1:20–1:45?') and confirm your translation before cutting. Version everything (v1, v2 — never 'final_final2'), send timestamped review links, and when a request exceeds the agreed scope, offer the professional choice — 'happy to; that's beyond the two included rounds, so it'd be billed at X' — kindly and without apology.",
        points: [
          "Rounds, not trickles: one consolidated batch per round, all stakeholders.",
          "Translate vague notes into timestamped, editable instructions — confirm before cutting.",
          "Version discipline: v1, v2, v3. 'Final_final2' is a confession.",
          "Out-of-scope requests get a friendly yes-with-a-price, not silent resentment.",
        ],
      },
      {
        heading: "Delivery, naming & the archive",
        body:
          "Delivery is your last impression, so make it boring in the best way. Know the spec before exporting: platform, resolution, frame rate, codec (H.264/H.265 MP4 covers most online delivery), loudness target, caption requirements. Name files so a stranger understands them: client_project_deliverable_version_date. Deliver via a reliable link with a short note listing what's included. Then archive like you'll be sued: keep the project file, final exports and (budget permitting) media in an organized structure for an agreed period — the 'can we get a 9:16 version of last spring's video?' call is a revenue opportunity only if you can reopen the project. Your project files should be clean enough to hand to another editor mid-project; that's the standard.",
        points: [
          "Get the spec sheet BEFORE the final export: platform, res, fps, codec, loudness, captions.",
          "Naming convention: client_project_deliverable_version_date — no exceptions.",
          "Deliver with a note: what's included, what specs, what's next.",
          "Archive projects handoff-clean; old projects are future revenue.",
        ],
      },
    ],
    practice: "Write your personal client kit: a 5-question brief checklist, a two-round revision policy, a file-naming convention, and a delivery spec sheet for the three platforms you deliver to most.",
    watch: "How senior editors and post houses handle feedback — review-link etiquette, change-list formats, and how they say 'no' gracefully.",
    learn: "Brief interrogation, revision rounds, feedback translation, versioning, export specs, naming conventions, archiving.",
    drill: [
      "Take a real (or invented) vague brief: 'we need a launch video, make it exciting, ~1 minute.'",
      "Write the five clarifying questions and realistic client answers.",
      "Draft the one-paragraph brief confirmation you'd send back.",
      "Simulate a vague note ('the middle is boring?') — write the timestamped translation you'd confirm before cutting.",
      "Produce the delivery package plan: file names, export specs per platform, and the delivery note.",
    ],
    takeaways: [
      "Clients rehire reliability. Talent gets you in; professionalism keeps you in.",
      "Every hour spent on the brief saves three in revisions.",
      "Structure feedback into rounds and translate vague notes before cutting.",
      "Deliver to spec, name things properly, archive everything — boring excellence wins.",
    ],
    scenarios: [
      {
        title: "Vague brief",
        situation: "The client just says “make it pop” and expects you to start cutting.",
        approach: "Ask for references, target platform, length, and tone before you touch the timeline.",
        why: "'Pop' means something specific in the client's head — you just can't see it. Two reference videos externalize their taste in minutes and prevent an entire round of 'not quite what I imagined.'",
        steps: [
          "Reply with the five questions: audience, desired outcome, 2–3 reference videos they love (and one they hate), constraints, final approver.",
          "Ask specifically what makes their references good — the answer reveals whether 'pop' means pacing, graphics, music or color.",
          "Summarize the answers in one paragraph and get written agreement.",
          "Only then open the NLE.",
        ],
        pitfall: "Starting the edit while 'clarifying as you go'. The first cut anchors the client's expectations — anchor them on the brief instead.",
      },
      {
        title: "Endless revisions",
        situation: "Feedback keeps trickling in — a message today, two more tomorrow, a new stakeholder next week.",
        approach: "Batch feedback into rounds, confirm scope, and deliver versioned exports; define what “done” means up front.",
        why: "Trickled feedback means the timeline never stabilizes and stakeholders react to different versions. Rounds force consolidation — and consolidation forces the client's internal disagreements to resolve on their side, not in your timeline.",
        steps: [
          "Announce the structure at kickoff: 'two revision rounds included; each round is one consolidated list from all stakeholders.'",
          "When notes trickle, respond warmly but hold the line: 'adding this to the round-2 list — anything else before I start it?'",
          "Number every delivery (v1, v2) and attach each feedback list to the version it addressed.",
          "For requests beyond round two, quote the additional cost cheerfully and let the client decide.",
        ],
        pitfall: "Doing 'tiny' extra changes to avoid awkwardness. Each freebie redefines the deal — scope creep is taught, one small yes at a time.",
      },
      {
        title: "Wrong export",
        situation: "The delivered file looks wrong on the platform — soft, stuttery, or oddly cropped.",
        approach: "Deliver to spec — correct codec, resolution, fps, and loudness (H.264 MP4 for most).",
        why: "Platforms re-encode everything; a wrong source compounds into a visibly degraded result. Matching the platform's recommended spec is the difference between 'crisp' and 'why does it look worse than the preview?'",
        steps: [
          "Get the destination spec BEFORE exporting (platform docs or the client's spec sheet).",
          "Match timeline fps to source footage; export H.264/H.265 MP4 at the platform's recommended bitrate.",
          "Check loudness (≈ −16 LUFS online) and true peak (under −1 dBTP).",
          "Watch the ACTUAL uploaded result on the actual platform before calling it delivered.",
        ],
        pitfall: "Exporting one 'universal' file for every destination. A YouTube master, a 9:16 Reel and a broadcast file are different deliverables — budget and export for each.",
      },
      {
        title: "File chaos",
        situation: "Nobody can find the latest version and the client just gave feedback on an old cut.",
        approach: "Name files consistently (project-episode-version) and keep the project and bins organized.",
        why: "Feedback on the wrong version wastes a full round and erodes trust. A boring, rigid naming convention makes the newest file self-evident to every person on the project, including future-you.",
        steps: [
          "Adopt one pattern everywhere: client_project_deliverable_v03_2026-07-04.",
          "Keep ONE canonical delivery folder per project; superseded cuts move to an /old subfolder immediately.",
          "Send each new version as a fresh link with the version name in the message; explicitly retire the old link.",
          "Mirror the discipline inside the project: labeled bins and sequences (A-roll, B-roll, Audio, GFX, Exports).",
        ],
        pitfall: "Ever writing the word 'final' in a filename. There is no final — there are versions, and v-numbers never lie to you the way 'final_FINAL_approved2' does.",
      },
      {
        title: "Deadline at risk",
        situation: "You realize mid-project you might miss the delivery date.",
        approach: "Communicate early, send a rough cut for feedback, and protect autosave/backups to avoid losing work.",
        why: "Clients can absorb a schedule change they hear about early; they can't absorb a surprise on delivery day. An early rough cut converts dead waiting time into a parallel feedback cycle — often recovering the schedule entirely.",
        steps: [
          "Flag the risk the moment you see it, with a new realistic date and a reason — no drama, no over-apology.",
          "Offer a rough cut now: the client reviews structure while you continue polishing, overlapping the timelines.",
          "Cut scope before quality if needed: deliver the hero video on time, the extra verticals two days later.",
          "Protect the work: autosave on, project backed up to a second location — a crash on deadline eve is not an excuse, it's negligence.",
        ],
        pitfall: "Going silent while you 'try to catch up'. Silence reads as unreliability even if you make the date — communication IS the professionalism.",
      },
    ],
  },
];
