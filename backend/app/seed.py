"""Idempotent seed data: courses, lessons, quizzes, challenges, channels.

Runs on startup. Only inserts a table's data when that table is empty, so it
is safe to run repeatedly and never clobbers user progress.
"""
from urllib.parse import quote_plus

from sqlalchemy import select, func

from app.core.database import SessionLocal
from app.models import (
    Challenge,
    Checklist,
    ChecklistItem,
    Course,
    Lesson,
    Quiz,
    QuizQuestion,
    ReferenceChannel,
)


def yt(query: str) -> str:
    """A YouTube search link that reliably opens the intended video."""
    return f"https://www.youtube.com/results?search_query={quote_plus(query)}"


# ─────────────────────────────────────────────────────────────
# Courses & lessons (Learning Academy)
# ─────────────────────────────────────────────────────────────
COURSES = [
    {
        "slug": "foundations", "title": "Foundations", "level": "beginner",
        "category": "foundations", "icon": "Sparkles", "order_index": 1,
        "description": "The core skills every editor needs before anything else.",
        "lessons": [
            ("Editing Basics", "What editing really is — and isn't.",
             "Editing is decision-making. Every cut answers a question: what does the viewer need to see next? Learn the editor's mindset, the role of intention, and how to watch footage like an editor."),
            ("Timeline Organization", "Keep your project clean and fast.",
             "Label tracks, color-code clips, use markers, and build a consistent bin structure. An organized timeline is the difference between flow and frustration."),
            ("Cutting Techniques", "The grammar of the cut.",
             "Hard cuts, J-cuts, L-cuts, match cuts, and cutaways. Learn when each one serves the story and how to cut on action for invisible edits."),
            ("Audio Fundamentals", "Why audio is half the edit.",
             "Levels, peaks, and the −12 dB rule. Dialogue clarity, room tone, and why bad audio loses viewers faster than bad video."),
            ("Storytelling Basics", "Structure that holds attention.",
             "Setup, tension, payoff. Every video — even a 30-second clip — is a story. Learn the three-act spine and how to find the story in raw footage."),
        ],
    },
    {
        "slug": "intermediate", "title": "Intermediate", "level": "intermediate",
        "category": "intermediate", "icon": "Gauge", "order_index": 2,
        "description": "Level up retention, energy, and visual craft.",
        "lessons": [
            ("Pacing", "Control the viewer's heartbeat.",
             "Pacing is rhythm. Vary shot length, use the cut to create energy or calm, and learn how silence and speed both serve attention."),
            ("Motion Graphics", "Make information move.",
             "Animate text, build lower-thirds, and add tasteful transitions that guide the eye without distracting from the message."),
            ("Sound Design", "Build a world with sound.",
             "Layer ambience, SFX, whooshes and risers. Sound design adds the emotion the picture can't carry alone."),
            ("Retention Editing", "Stop the scroll, keep the watch.",
             "Hooks, open loops, pattern interrupts, and removing every dead second. Editing built for the analytics graph."),
            ("B-roll Strategy", "Show, don't just tell.",
             "Choose b-roll that advances meaning, not just fills space. Match visuals to the narration beat and cover your cuts."),
        ],
    },
    {
        "slug": "advanced", "title": "Advanced", "level": "advanced",
        "category": "advanced", "icon": "Crown", "order_index": 3,
        "description": "Cinematic, commercial, and psychological mastery.",
        "lessons": [
            ("Color Grading", "Set the mood with color.",
             "From correction to creative grade. Balance exposure, shape contrast, and design a look that supports the story's emotion."),
            ("Documentary Editing", "Truth, shaped with care.",
             "Interview-driven structure, archival weaving, and building a narrative arc from real, unscripted material."),
            ("Commercial Editing", "Sell in seconds.",
             "Punchy pacing, product hero moments, and a relentless focus on a single message and call-to-action."),
            ("Conference Highlights", "Energy from the stage to the feed.",
             "Multi-cam cutting, music sync, audience reactions, and tight speaker cuts that keep momentum high."),
            ("Cinematic Editing", "The feel of film.",
             "Motivated cuts, breathing room, sound-led transitions, and restraint. Make a video feel directed, not assembled."),
            ("Editing Psychology", "Edit for the brain.",
             "Attention, anticipation, and emotional pacing. Understand why certain cuts land and how to design for feeling."),
        ],
    },
    {
        "slug": "color-grading-academy", "title": "Color Grading Academy", "level": "advanced",
        "category": "color", "icon": "Palette", "order_index": 4,
        "description": "Exposure to cinematic looks, with practical exercises.",
        "lessons": [
            ("Exposure & Contrast", "Get the base right first.",
             "Read your scopes, set black/white points, and shape contrast before touching color."),
            ("White Balance", "Neutral before creative.",
             "Correct color casts so skin and whites read true, then grade with intent."),
            ("Saturation & Skin Tones", "Protect the people.",
             "Use the skin-tone line on the vectorscope; saturate the world without making faces look orange."),
            ("LUTs & Cinematic Looks", "Build and apply looks.",
             "Use LUTs as a starting point, not a crutch. Design a repeatable look that fits the brand and mood."),
        ],
    },
    {
        "slug": "audio-academy", "title": "Audio Academy", "level": "intermediate",
        "category": "audio", "icon": "AudioLines", "order_index": 5,
        "description": "Music, ambience, SFX, ducking, and mixing.",
        "lessons": [
            ("Music Selection", "The emotional engine.",
             "Pick tracks by energy curve and tempo; cut to the beat and let music shape pacing."),
            ("Ambient Sound & SFX", "Make it believable.",
             "Layer room tone and ambience so cuts feel continuous; place SFX to punctuate motion."),
            ("Whooshes & Risers", "Direct attention.",
             "Use transitional sound to bridge cuts and build anticipation into reveals."),
            ("Audio Ducking & Mixing", "Everything in its place.",
             "Duck music under dialogue, balance the mix, and master to consistent loudness."),
        ],
    },
    {
        "slug": "typography-academy", "title": "Typography Academy", "level": "intermediate",
        "category": "typography", "icon": "Type", "order_index": 6,
        "description": "Inspired by GaryVee, The Futur, and Adobe.",
        "lessons": [
            ("Font Pairing", "Two fonts, one voice.",
             "Pair a display and a body font with clear contrast; avoid clashing personalities."),
            ("Hierarchy", "Guide the eye.",
             "Use size, weight and spacing so the most important word is seen first."),
            ("Caption Styles", "Built for sound-off viewing.",
             "Readable, well-timed captions with safe margins and strong contrast."),
            ("Motion Typography", "Type that performs.",
             "Animate with purpose — entrances that emphasize, never distract."),
        ],
    },
    {
        "slug": "training-probation-policy",
        "title": "Video Editor Training & Probation Policy",
        "level": "policy", "category": "policy", "icon": "ClipboardCheck",
        "order_index": 7,
        "description": "Department: Media / Content · Applicable to all Video Editors (Trainee & Probation). The structured 3-month training, evaluation, and confirmation path.",
        "lessons": [
            ("1. Purpose of This Policy",
             "Why this policy exists.",
             "This policy defines the structured training, evaluation, and confirmation process for video editors at the company. The goal is to ensure consistent content quality, brand alignment, accountability, and professional growth."),
            ("2. Training & Probation Duration",
             "Total duration: 3 months, across three levels.",
             "The probation period is 3 months total, divided into three levels:\n\n"
             "• Level 1 – Beginner (Foundation)\n"
             "• Level 2 – Intermediate / Independent: Short-Form Editor (Reels & Shorts)\n"
             "• Level 3 – Advanced: Long-Form Video Editor (Final training level)\n\n"
             "Progression between levels depends on performance, consistency, and attitude — not only time spent."),
            ("3a. Level 1 – Beginner / Foundation",
             "Understand the tools, workflow, and content standards.",
             "Objective: To understand editing tools, workflow, and company content standards.\n\n"
             "• Focus on learning short-form editing\n"
             "• Close supervision required\n"
             "• Mistakes are expected, but improvement is mandatory"),
            ("3b. Level 2 – Intermediate",
             "Independently handle short-form content with consistency.",
             "Objective: To independently handle short-form content with consistency and discipline.\n\n"
             "• Responsible for 20+ reels/shorts per week\n"
             "• Expected to meet deadlines consistently\n"
             "• Minimal supervision\n"
             "• Quality should be post-ready with minor revisions — less than 1 revision per 10 videos"),
            ("3c. Level 3 – Advanced",
             "Handle long-form YouTube videos independently (final level).",
             "Objective: To handle long-form YouTube videos independently.\n\n"
             "• Responsible for editing long videos\n"
             "• Focus on storytelling, flow, pacing, and retention\n"
             "• Quality & quantity\n"
             "• Less than one revision per 20 videos\n\n"
             "This is the final level of training."),
            ("4. Performance Evaluation Criteria",
             "How editors are evaluated.",
             "Editors are evaluated on:\n\n"
             "• Video Quality\n"
             "• Quantity & Time Management\n"
             "• Communication & Professionalism\n"
             "• Task Understanding & Execution\n"
             "• Willingness to Learn & Feedback Implementation\n"
             "• Technical Skills\n"
             "• Brand Alignment & Attention to Detail\n"
             "• Reliability & Work Ethics\n\n"
             "Evaluation tracker: https://docs.google.com/spreadsheets/d/1XcETGPjYfOGnC2_O6_iaYtVgtb8_5zQtpa6k-veBiRE/edit?usp=sharing"),
            ("5. Confirmation Outcome",
             "The decision at the end of probation.",
             "At the end of the probation period, the editor may be:\n\n"
             "• Declared Not Suitable\n"
             "• Given Extended Training\n"
             "• Confirmed as a Full-Time Video Editor\n\n"
             "Management's decision will be final, based on documented performance."),
        ],
    },
]


# ─────────────────────────────────────────────────────────────
# Quizzes  (question count scales with level: beginner 5 · intermediate 7 · advanced 10)
# ─────────────────────────────────────────────────────────────
QUIZZES = [
    {
        "slug": "broll-selection", "title": "B-roll Selection", "topic": "B-roll",
        "level": "beginner", "description": "Choose b-roll that serves the story.",
        "questions": [
            ("The narrator says 'our team works late into the night.' Best b-roll?",
             ["A sunny office exterior", "A dim office with people at desks, screens glowing",
              "A stock graph going up", "A logo animation"], 1,
             "Match the visual to the meaning and mood — late night, focused work."),
            ("B-roll's primary job is to…",
             ["Fill silence", "Advance or reinforce meaning while covering cuts",
              "Show off your camera", "Add random motion"], 1,
             "Good b-roll carries meaning and hides edits; it's not filler."),
            ("You have a jump cut in an interview. The cleanest fix is to…",
             ["Add a whoosh", "Cover it with relevant b-roll or a cutaway",
              "Zoom in randomly", "Leave it"], 1,
             "A cutaway over the cut makes it invisible."),
            ("When narration names a specific product, the strongest b-roll is…",
             ["A generic city skyline", "A clean close-up of that product in use",
              "An unrelated stock clip", "A black screen"], 1,
             "Show exactly what's being discussed — specificity builds trust and clarity."),
            ("B-roll usually lands best when it appears…",
             ["A few seconds after the matching line", "Slightly before/at the matching narration",
              "Only during the intro", "Randomly throughout"], 1,
             "Seeing the visual as you hear the line reinforces the point and feels intentional."),
        ],
    },
    {
        "slug": "audio", "title": "Audio", "topic": "Audio",
        "level": "beginner", "description": "Levels, ducking, and clarity.",
        "questions": [
            ("Dialogue typically sits comfortably around…",
             ["−3 dB", "−12 dB", "0 dB", "−40 dB"], 1,
             "Around −12 dB leaves headroom and keeps dialogue clear without clipping."),
            ("'Ducking' means…",
             ["Cutting bass", "Lowering music under dialogue automatically",
              "Adding reverb", "Speeding up audio"], 1,
             "Ducking lowers the music when someone speaks so dialogue stays intelligible."),
            ("Room tone is…",
             ["A type of microphone", "The ambient sound of a location used to smooth edits",
              "A music genre", "A color preset"], 1,
             "Capturing room tone lets you bridge audio edits so cuts don't feel abrupt."),
            ("Audio that peaks at 0 dB will likely…",
             ["Sound richer", "Clip and distort", "Become quieter", "Improve clarity"], 1,
             "Hitting 0 dBFS clips the signal — leave headroom to avoid distortion."),
            ("Music under a voiceover should generally be…",
             ["Louder than the voice", "Ducked ~10–15 dB below the dialogue",
              "Muted entirely", "At the same level as the voice"], 1,
             "Keep music well under dialogue so words stay the focus."),
        ],
    },
    {
        "slug": "storytelling", "title": "Storytelling", "topic": "Storytelling",
        "level": "intermediate", "description": "Structure, hooks, and arcs.",
        "questions": [
            ("The hook's job in the first seconds is to…",
             ["Introduce yourself fully", "Create a curiosity gap or promise",
              "Show the outro", "Play music"], 1,
             "A hook opens a loop the viewer wants closed — that keeps them watching."),
            ("An 'open loop' is…",
             ["A music bed", "An unresolved question that pulls viewers forward",
              "A transition", "A color preset"], 1,
             "Open loops create anticipation that sustains retention."),
            ("The classic three-act spine is…",
             ["Intro, ads, outro", "Setup, tension, payoff",
              "Wide, medium, close", "Cut, fade, dissolve"], 1,
             "Setup → tension → payoff gives even a short clip a satisfying arc."),
            ("The 'so what?' test checks whether…",
             ["The file exported", "Each scene earns its place and matters to the viewer",
              "The audio peaks", "The color is graded"], 1,
             "If a scene doesn't move the story or matter to the viewer, cut it."),
            ("A montage is most useful to…",
             ["Pad the runtime", "Compress time while showing progress or change",
              "Avoid b-roll", "Hide bad audio"], 1,
             "Montage condenses a long process into an energetic, meaningful sequence."),
            ("To raise the stakes in a story you should…",
             ["Lower the volume", "Make the consequence of failure clear",
              "Add more transitions", "Speed everything up"], 1,
             "When viewers understand what's at risk, they care about the outcome."),
            ("A 'callback' at the end of a video…",
             ["Resets the analytics", "Pays off something set up earlier, rewarding attention",
              "Is a type of CTA", "Means re-shooting"], 1,
             "Callbacks reward viewers who stayed and create a satisfying, full-circle finish."),
        ],
    },
    {
        "slug": "pacing", "title": "Pacing", "topic": "Pacing",
        "level": "intermediate", "description": "Rhythm and energy control.",
        "questions": [
            ("To raise energy in a sequence you generally…",
             ["Lengthen every shot", "Shorten shots and quicken cuts",
              "Add more silence", "Slow the music"], 1,
             "Shorter shots and faster cuts increase perceived energy and pace."),
            ("A pattern interrupt is used to…",
             ["End the video", "Reset attention before it drops",
              "Add credits", "Lower volume"], 1,
             "Interrupts (zoom, b-roll, sound) reset attention and prevent drop-off."),
            ("A J-cut (audio leads the picture) helps pacing by…",
             ["Adding noise", "Pulling the viewer forward into the next scene",
              "Slowing momentum", "Hiding the audio"], 1,
             "Leading with the next scene's audio smooths the transition and drives momentum."),
            ("Holding a shot longer is appropriate when…",
             ["Always", "The moment is emotional and needs room to breathe",
              "Never", "The footage is shaky"], 1,
             "Pacing isn't only fast — give weighty, emotional beats space."),
            ("Removing 'ums', pauses, and dead air is called…",
             ["Color grading", "Tightening the edit",
              "Ducking", "Keyframing"], 1,
             "Tightening removes everything that doesn't earn its place, lifting pace."),
            ("Cutting on action works because…",
             ["It adds an effect", "Motion carries the eye across the cut, hiding it",
              "It slows the scene", "It needs no b-roll"], 1,
             "A cut during movement is far less noticeable than one on a static frame."),
            ("Cut rate should generally match…",
             ["The export setting", "The energy of the music and content",
              "The file size", "The aspect ratio"], 1,
             "Sync your cutting rhythm to the track and mood for a cohesive feel."),
        ],
    },
    {
        "slug": "color-grading", "title": "Color Grading", "topic": "Color grading",
        "level": "advanced", "description": "Test your grading fundamentals.",
        "questions": [
            ("Before any creative grade you should first…",
             ["Add a LUT", "Crush the blacks", "Balance exposure and white balance",
              "Boost saturation"], 2,
             "Correct exposure and white balance create a neutral base to grade from."),
            ("Which scope best protects natural skin tones?",
             ["Histogram", "Waveform", "Vectorscope (skin-tone line)", "RGB parade"], 2,
             "The vectorscope's skin-tone line shows whether skin sits where it should."),
            ("A LUT should be treated as…",
             ["The final look", "A starting point you refine", "A replacement for correction",
              "Only for log footage"], 1,
             "LUTs are a base; you still correct and refine for each shot."),
            ("The first step of primary correction is to…",
             ["Add grain", "Set exposure with black and white points",
              "Apply a creative LUT", "Add vignette"], 1,
             "Set your tonal range first using scopes before anything stylistic."),
            ("Lifting the blacks tends to create…",
             ["A harsh, contrasty look", "A softer, faded/filmic look",
              "More saturation", "Sharper edges"], 1,
             "Raising the black point reduces contrast for that gentle, cinematic feel."),
            ("Teal-and-orange is popular because…",
             ["It's the only LUT", "Skin (orange) contrasts against teal shadows",
              "It removes noise", "It fixes white balance"], 1,
             "Complementary colors make subjects pop against cooler backgrounds."),
            ("To match two shots reliably you should compare…",
             ["Only your eyes", "Scopes (waveform/vectorscope)",
              "File sizes", "The thumbnails"], 1,
             "Eyes adapt and deceive; scopes give objective targets to match."),
            ("Vibrance differs from saturation because vibrance…",
             ["Affects only blacks", "Boosts muted colors while protecting skin tones",
              "Removes color", "Only works in HDR"], 1,
             "Vibrance is a smarter saturation that spares already-saturated tones like skin."),
            ("Node / layer order matters because…",
             ["It changes export speed", "Corrections compound — correct before you stylize",
              "It sets resolution", "It has no effect"], 1,
             "Grading is cumulative; a clean correction first makes the creative grade predictable."),
            ("HDR vs SDR grading differs mainly in…",
             ["File format only", "Available dynamic range and peak brightness",
              "Frame rate", "Audio levels"], 1,
             "HDR offers far more highlight range, so you grade brightness and specular detail differently."),
        ],
    },
]


# ─────────────────────────────────────────────────────────────
# Challenges (daily / b-roll / editing)
# ─────────────────────────────────────────────────────────────
CHALLENGES = [
    {
        "slug": "daily-hook", "title": "Sharpen the Hook", "level": "beginner",
        "kind": "daily", "xp_reward": 100,
        "description": "A viewer decides in 3 seconds. Pick the strongest opening line.",
        "payload": {
            "question": "Which opening hooks hardest for a video on saving money?",
            "options": [
                "Hi everyone, welcome back to my channel.",
                "Today I want to talk about budgeting.",
                "I saved $10,000 in 90 days — here's the exact system.",
                "Money is an important topic for everyone.",
            ],
            "correct_index": 2,
            "explanation": "A specific, surprising result plus a promise creates an open loop.",
        },
    },
    {
        "slug": "broll-late-night", "title": "B-roll Match: Late Night", "level": "beginner",
        "kind": "broll", "xp_reward": 120,
        "description": "Narration: 'We pushed through the night to ship it.' Pick the best b-roll.",
        "payload": {
            "question": "Best b-roll for 'we pushed through the night to ship it'?",
            "options": [
                "Bright midday park scene",
                "Dim room, glowing monitors, tired focused faces",
                "Slow stock footage of clouds",
                "A rotating 3D logo",
            ],
            "correct_index": 1,
            "explanation": "Visual mood must match the narration — late, focused, determined.",
        },
    },
    {
        "slug": "editing-pacing", "title": "Fix the Pacing", "level": "intermediate",
        "kind": "editing", "xp_reward": 150,
        "description": "A talking-head clip feels slow and viewers drop off. What helps most?",
        "payload": {
            "question": "Retention drops during a long talking-head section. Best fix?",
            "options": [
                "Add background music only",
                "Tighten cuts, remove filler words, add b-roll and zoom punches",
                "Increase the resolution",
                "Add a longer intro",
            ],
            "correct_index": 1,
            "explanation": "Cut dead air, vary the visual, and add motivated motion to hold attention.",
        },
    },
    {
        "slug": "transition-choice", "title": "Choose the Transition", "level": "intermediate",
        "kind": "editing", "xp_reward": 130,
        "description": "Moving from a calm intro to a high-energy montage.",
        "payload": {
            "question": "Best transition from calm intro into an energetic montage?",
            "options": [
                "Slow cross-dissolve",
                "Whoosh-led hard cut on the beat",
                "Random spin transition",
                "Fade to black for 3 seconds",
            ],
            "correct_index": 1,
            "explanation": "A sound-led cut on the musical beat delivers energy and feels intentional.",
        },
    },
    {
        "slug": "advanced-grade", "title": "Grade for Mood", "level": "advanced",
        "kind": "editing", "xp_reward": 180,
        "description": "A nostalgic, warm memory sequence. What grade fits?",
        "payload": {
            "question": "Which grade best supports a warm, nostalgic memory scene?",
            "options": [
                "Cool teal shadows, high clarity",
                "Warm highlights, lifted/soft blacks, gentle contrast",
                "Heavy saturation, crushed blacks",
                "Pure neutral correction only",
            ],
            "correct_index": 1,
            "explanation": "Warmth and lifted blacks read as nostalgic and soft, supporting the emotion.",
        },
    },
]


# ─────────────────────────────────────────────────────────────
# Reference Channels
# ─────────────────────────────────────────────────────────────
CHANNELS = [
    {
        "slug": "vusi-thembekwayo", "name": "Vusi Thembekwayo", "accent": "violet",
        "description": "Speaker and entrepreneur known for commanding stage presence and emotionally charged delivery.",
        "editing_style": "Highlight-driven, emotion-forward editing that rides speech rhythm and audience energy.",
        "learn": ["Speech pacing", "Emotional storytelling", "Audience reactions", "Highlight editing"],
        "youtube_url": "https://www.youtube.com/@vthembekwayo",
        "recommended_videos": [
            {"title": "Keynote highlight reels", "url": yt("Vusi Thembekwayo keynote highlights")},
            {"title": "Powerful Q&A moments", "url": yt("Vusi Thembekwayo Q&A best moments")},
            {"title": "Best motivational speeches", "url": yt("Vusi Thembekwayo motivational speech")},
        ],
    },
    {
        "slug": "pbd-valuetainment", "name": "PBD / Valuetainment", "accent": "orange",
        "description": "Business media channel famous for high-energy conference and interview content.",
        "editing_style": "Fast, music-synced, multi-camera conference editing with punchy speaker cuts.",
        "learn": ["High-energy conference editing", "Music synchronization", "Multi-camera editing", "Fast speaker cuts"],
        "youtube_url": "https://www.youtube.com/@VALUETAINMENT",
        "recommended_videos": [
            {"title": "Vault Conference recaps", "url": yt("Valuetainment Vault Conference recap")},
            {"title": "Multi-cam interviews (PBD Podcast)", "url": yt("PBD Podcast best interview moments")},
            {"title": "Patrick Bet-David keynotes", "url": yt("Patrick Bet-David keynote")},
        ],
    },
    {
        "slug": "john-harris", "name": "John Harris", "accent": "sky",
        "description": "Cinematic documentary storyteller with deliberate, structured pacing.",
        "editing_style": "Documentary-grade structure with cinematic pacing and strong narrative arcs.",
        "learn": ["Story structure", "Documentary editing", "Cinematic pacing"],
        "youtube_url": yt("John Harris cinematic documentary filmmaker"),
        "recommended_videos": [
            {"title": "Short documentary pieces", "url": yt("cinematic short documentary editing")},
            {"title": "Story-driven edits", "url": yt("documentary storytelling edit breakdown")},
            {"title": "Cinematic pacing examples", "url": yt("cinematic documentary pacing example")},
        ],
    },
    {
        "slug": "garyvee", "name": "GaryVee", "accent": "rose",
        "description": "Entrepreneur producing massive volumes of bold, fast social content.",
        "editing_style": "Bold captions, sudden zooms, crowd energy, and relentless fast pacing for social.",
        "learn": ["Bold captions", "Sudden zooms", "Crowd energy", "Fast pacing", "Social media editing"],
        "youtube_url": "https://www.youtube.com/@garyvee",
        "recommended_videos": [
            {"title": "Keynote clip edits", "url": yt("GaryVee keynote clips")},
            {"title": "Tea With GaryVee cuts", "url": yt("Tea With GaryVee")},
            {"title": "Best motivational shorts", "url": yt("GaryVee motivation shorts")},
        ],
    },
    {
        "slug": "tedx", "name": "TEDx Talks", "accent": "red",
        "description": "Global talks platform with polished, presentation-focused editing.",
        "editing_style": "Smooth, restrained editing that supports the speaker and the idea.",
        "learn": ["Smooth transitions", "Audience reactions", "Presentation editing", "Speaker changes"],
        "youtube_url": "https://www.youtube.com/@TEDx",
        "recommended_videos": [
            {"title": "Most-viewed TEDx talks", "url": yt("most viewed TEDx talk")},
            {"title": "Idea-driven talks", "url": yt("best TEDx talks ideas")},
            {"title": "Storytelling talks", "url": yt("TEDx storytelling talk")},
        ],
    },
    {
        "slug": "the-futur", "name": "The Futur", "accent": "amber",
        "description": "Design and business education channel with strong typographic identity.",
        "editing_style": "Typography-led, educational editing with inspirational pacing and clean sound bites.",
        "learn": ["Typography", "Educational sound bites", "Inspirational pacing", "Highlight videos"],
        "youtube_url": "https://www.youtube.com/@thefutur",
        "recommended_videos": [
            {"title": "Branding deep-dives", "url": yt("The Futur branding")},
            {"title": "Highlight compilations", "url": yt("The Futur best moments")},
            {"title": "Typography & design lessons", "url": yt("The Futur typography")},
        ],
    },
    {
        "slug": "adobe-creative-cloud", "name": "Adobe Creative Cloud", "accent": "fuchsia",
        "description": "Official Adobe channel showcasing professional motion and design work.",
        "editing_style": "Polished motion graphics and professional transitions, Adobe MAX recap energy.",
        "learn": ["Motion graphics", "Adobe MAX recap styles", "Professional transitions"],
        "youtube_url": "https://www.youtube.com/@AdobeCreativeCloud",
        "recommended_videos": [
            {"title": "Adobe MAX recaps", "url": yt("Adobe MAX recap")},
            {"title": "Motion graphics showcases", "url": yt("Adobe After Effects motion graphics showcase")},
            {"title": "Premiere Pro tutorials", "url": yt("Adobe Premiere Pro tutorial")},
        ],
    },
    {
        "slug": "google-for-developers", "name": "Google for Developers", "accent": "emerald",
        "description": "Google's developer channel with clean technical presentations and event coverage.",
        "editing_style": "Clear information hierarchy and clean event highlight editing.",
        "learn": ["Clean technical presentations", "Information hierarchy", "Event highlight editing"],
        "youtube_url": "https://www.youtube.com/@GoogleDevelopers",
        "recommended_videos": [
            {"title": "Google I/O keynote highlights", "url": yt("Google I/O keynote highlights")},
            {"title": "Technical sessions", "url": yt("Google for Developers technical session")},
            {"title": "Developer keynotes", "url": yt("Google Developers keynote")},
        ],
    },
    {
        "slug": "stanford-gsb", "name": "Stanford Graduate School of Business", "accent": "cyan",
        "description": "Stanford GSB talks centered on big ideas and educational storytelling.",
        "editing_style": "Idea-first editing with educational highlights and clear presentation structure.",
        "learn": ["Big idea storytelling", "Educational highlights", "Presentation structure"],
        "youtube_url": "https://www.youtube.com/@stanfordgsb",
        "recommended_videos": [
            {"title": "View From The Top series", "url": yt("Stanford GSB View From The Top")},
            {"title": "Insights talks", "url": yt("Stanford GSB insights talk")},
            {"title": "Leadership lectures", "url": yt("Stanford GSB leadership")},
        ],
    },
]


# ─────────────────────────────────────────────────────────────
# Checklists (editing workflows)
# ─────────────────────────────────────────────────────────────
CHECKLISTS = [
    {
        "slug": "boardroom-prayer-room-clips",
        "title": "Boardroom x Prayer Room — Podcast Clips",
        "category": "Short-form", "icon": "Scissors", "order_index": 1,
        "description": "Turning a full podcast episode into postable short clips.",
        "items": [
            "Select and trim the best 1–2 min clips from the full episode",
            "Add auto-captions",
            "Remove filler words (ums, uhs, repeated phrases)",
            "Export as video file ready for posting",
        ],
    },
    {
        "slug": "monthly-leadership-reels",
        "title": "Monthly Leadership Reels",
        "category": "Short-form", "icon": "Clapperboard", "order_index": 2,
        "description": "Avatar-led leadership reels, 60–90 seconds.",
        "items": [
            "Generate HeyGen avatar segment",
            "Source and sync relevant b-roll footage",
            "Add subtitles",
            "Keep final length within 60–90 seconds",
            "Export and do a final review",
        ],
    },
    {
        "slug": "podcast-audio-series",
        "title": "Podcast Audio Series (per episode)",
        "category": "Audio", "icon": "AudioLines", "order_index": 3,
        "description": "Full audio post-production checklist for each episode.",
        "items": [
            "Check and adjust audio levels — target -16 LUFS loudness",
            "Remove long silences and dead air",
            "Remove filler words (ums, uhs, repeated phrases)",
            "Apply noise reduction / remove background noise",
            "Add intro and outro music (if applicable)",
            "Export to MP3 — 128 kbps mono or 192 kbps stereo",
            "Name file correctly: episode-title-ep-number.mp3",
            "Do a final listen-through to catch any remaining errors",
        ],
    },
]


def run_seed() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(func.count()).select_from(Course)) == 0:
            for c in COURSES:
                course = Course(
                    slug=c["slug"], title=c["title"], description=c["description"],
                    level=c["level"], category=c["category"], icon=c["icon"],
                    order_index=c["order_index"],
                )
                for i, (title, summary, content) in enumerate(c["lessons"]):
                    course.lessons.append(
                        Lesson(title=title, summary=summary, content=content,
                               order_index=i, xp_reward=50)
                    )
                db.add(course)

        if db.scalar(select(func.count()).select_from(Quiz)) == 0:
            for q in QUIZZES:
                quiz = Quiz(slug=q["slug"], title=q["title"], topic=q["topic"],
                            level=q["level"], description=q["description"])
                for prompt, options, correct, explanation in q["questions"]:
                    quiz.questions.append(
                        QuizQuestion(prompt=prompt, options=options,
                                     correct_index=correct, explanation=explanation)
                    )
                db.add(quiz)

        if db.scalar(select(func.count()).select_from(Challenge)) == 0:
            for ch in CHALLENGES:
                db.add(Challenge(**ch))

        if db.scalar(select(func.count()).select_from(ReferenceChannel)) == 0:
            for ch in CHANNELS:
                db.add(ReferenceChannel(**ch))

        if db.scalar(select(func.count()).select_from(Checklist)) == 0:
            for cl in CHECKLISTS:
                checklist = Checklist(
                    slug=cl["slug"], title=cl["title"], description=cl["description"],
                    category=cl["category"], icon=cl["icon"], order_index=cl["order_index"],
                )
                for i, text in enumerate(cl["items"]):
                    checklist.items.append(ChecklistItem(text=text, order_index=i))
                db.add(checklist)

        db.commit()
    finally:
        db.close()
