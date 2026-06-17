"""AI service with provider fallback.

Strategy: a single interface (generate_broll / analyze_storytelling /
analyze_slides). When AI_PROVIDER is `openai` or `claude` and a key is
present, we call the real API. Otherwise — and on ANY error — we return
high-quality deterministic mock output so every feature is fully demoable
with zero spend and zero keys.

To wire a real provider later: set AI_PROVIDER + the matching key in .env.
"""
import base64
import html
import json
import re
import textwrap
import uuid

from app.core.config import settings


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def _split_scenes(script: str) -> list[str]:
    """Break a script into rough 'scenes' by paragraphs / sentences."""
    parts = [p.strip() for p in re.split(r"\n\s*\n", script) if p.strip()]
    if len(parts) <= 1:
        # Fall back to sentence grouping
        sentences = re.split(r"(?<=[.!?])\s+", script.strip())
        parts = [
            " ".join(sentences[i : i + 2]).strip()
            for i in range(0, len(sentences), 2)
            if " ".join(sentences[i : i + 2]).strip()
        ]
    return parts[:8] or [script.strip()]


def _keywords(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    stop = {"this", "that", "with", "from", "your", "have", "will", "they", "them",
            "what", "when", "then", "than", "into", "about", "their", "would"}
    seen, out = set(), []
    for w in words:
        if w not in stop and w not in seen:
            seen.add(w)
            out.append(w)
    return out[:5] or ["story"]


def _clamp(n: int) -> int:
    return max(0, min(100, n))


# ─────────────────────────────────────────────────────────────
# Mock generators
# ─────────────────────────────────────────────────────────────
# Shot-type cycle drives intentional variety (wide / medium / close / cutaway…).
_SHOT_CYCLE = [
    ("Wide establishing shot", "establishing"),
    ("Medium shot", "supporting"),
    ("Close-up insert", "insert"),
    ("Cutaway detail", "cutaway"),
    ("Reaction shot", "reaction"),
    ("Atmospheric b-roll", "atmospheric"),
]

# Conceptual devices for non-literal / metaphorical visuals.
_CONCEPT_DEVICES = [
    "a symbolic object that represents the idea",
    "a before/after or clean-vs-messy contrast",
    "a timelapse showing change over time (plant growing, sky shifting)",
    "a visual metaphor (flipping calendar pages, a path forward, an open door)",
    "an environmental detail that sets the mood (light through a window, hands at rest)",
]


def _mock_broll(script: str) -> dict:
    scenes = _split_scenes(script)
    out = []
    for i, scene in enumerate(scenes):
        kw = _keywords(scene)
        # Vary shot types per scene for a dynamic, non-repetitive sequence.
        s1 = _SHOT_CYCLE[i % len(_SHOT_CYCLE)]
        s2 = _SHOT_CYCLE[(i + 2) % len(_SHOT_CYCLE)]
        concept = _CONCEPT_DEVICES[i % len(_CONCEPT_DEVICES)]
        concept2 = _CONCEPT_DEVICES[(i + 3) % len(_CONCEPT_DEVICES)]

        gen_prompts = [
            {
                "label": f"Literal · {s1[0]}",
                "shot_type": s1[1],
                "approach": "literal",
                "prompt": (
                    f"{s1[0]}, cinematic, of {kw[0]} {('and ' + kw[1]) if len(kw) > 1 else ''} — "
                    f"directly illustrating: \"{scene[:90].strip()}\". Shallow depth of field, "
                    "soft natural lighting, subtle camera movement, 24fps, photoreal, color-graded, high detail."
                ),
                "resolution": "3840x2160 (4K)",
                "duration": "3–5s",
            },
            {
                "label": f"Conceptual · {s2[0]}",
                "shot_type": s2[1],
                "approach": "conceptual",
                "prompt": (
                    f"{s2[0]}, cinematic, conceptual visual representing the idea of \"{kw[0]}\" using "
                    f"{concept}. Evocative not literal, moody lighting, gentle motion, shallow focus, "
                    "filmic color grade, 24fps, photoreal, high detail."
                ),
                "resolution": "3840x2160 (4K)",
                "duration": "3–5s",
            },
        ]

        out.append(
            {
                "scene": scene[:160] + ("…" if len(scene) > 160 else ""),
                "broll_ideas": [
                    f"Close-up detail shot illustrating “{kw[0]}”",
                    f"Wide establishing shot setting the context for {kw[-1]}",
                    "Hands-in-action insert to keep visual momentum",
                ],
                "camera_angles": [
                    "Eye-level medium for the talking point",
                    "Low-angle hero shot for emphasis"
                    if i % 2
                    else "Over-the-shoulder for perspective",
                    "Drone / aerial pull-back for scale" if i == 0 else "Slow push-in",
                ],
                "motion_graphics": [
                    f"Kinetic text callout: “{kw[0].title()}”",
                    "Lower-third with the key statistic",
                ],
                "text_overlays": [
                    f"On-screen keyword: {kw[0].upper()}",
                    "Animated quote pull for the strongest line",
                ],
                "concept_ideas": [
                    f"Instead of showing “{kw[0]}” literally, show {concept}.",
                    f"Represent the feeling behind it with {concept2}.",
                    "Avoid the obvious first idea — pick the visual that conveys the emotion.",
                ],
                "shot_types": [
                    "Mix wide + medium + close-up so the sequence never feels repetitive",
                    f"This beat → {s1[0]} then cut to {s2[0]}",
                    "Add a reaction or cutaway to cover edits and keep momentum",
                ],
                "gen_prompts": gen_prompts,
                "stock_queries": [
                    f"{kw[0]} cinematic" if kw else "cinematic b-roll",
                    f"{kw[0]} close up" if kw else "close up detail",
                    f"{kw[-1]} wide shot" if len(kw) > 1 else f"{kw[0]} wide shot" if kw else "wide establishing shot",
                    concept.split("(")[0].strip(),
                ],
            }
        )
    return {"provider": "mock", "scenes": out}


def _mock_storytelling(script: str) -> dict:
    text = script.strip()
    words = len(text.split())
    has_question = "?" in text
    has_cta = bool(re.search(r"\b(subscribe|follow|click|join|comment|share|sign up|learn more)\b", text, re.I))
    first_line = text.split("\n")[0][:120]

    hook = _clamp(55 + (15 if has_question else 0) + (10 if words and len(first_line) < 90 else 0))
    pacing = _clamp(70 - max(0, (words - 250)) // 20)
    emotion = _clamp(50 + min(30, sum(text.lower().count(w) for w in ["you", "imagine", "feel", "story"]) * 5))
    curiosity = _clamp(50 + (20 if has_question else 0))
    cta = _clamp(40 + (40 if has_cta else 0))
    overall = round((hook + pacing + emotion + curiosity + cta) / 5)

    scores = [
        {"name": "Hook", "score": hook, "note": "Opens with a question — strong." if has_question else "Consider opening with a question or bold claim."},
        {"name": "Pacing", "score": pacing, "note": "Tighten longer sections; aim for one idea per beat." if pacing < 70 else "Good rhythm."},
        {"name": "Emotional impact", "score": emotion, "note": "Add a personal anecdote to deepen connection." if emotion < 70 else "Emotionally resonant."},
        {"name": "Curiosity", "score": curiosity, "note": "Plant an open loop early to keep viewers watching." if curiosity < 70 else "Good curiosity gaps."},
        {"name": "Call-to-action", "score": cta, "note": "No clear CTA detected — add one near the end." if not has_cta else "CTA present."},
    ]
    suggestions = [
        "Front-load your most surprising point in the first 5 seconds.",
        "Cut filler sentences — every line should earn its place.",
        "End on a single, specific call-to-action.",
        "Add a pattern interrupt (b-roll or zoom) every 7–10 seconds.",
    ]
    return {"provider": "mock", "overall": overall, "scores": scores, "suggestions": suggestions}


def _mock_slides(notes: str) -> dict:
    kw = _keywords(notes)
    return {
        "provider": "mock",
        "source": "text",
        "first_impression": f"In the 3-second test, the eye likely lands on the headline about “{kw[0]}”. Make sure that is the single most important message.",
        "layout": "Aim for a clear focal point with generous whitespace. Avoid more than ~6 lines of text; group related elements and keep consistent margins.",
        "typography": "Use one display font for headlines and one clean sans for body. Establish hierarchy with size/weight — headline ≥ 2× body size.",
        "clarity": "Make it scannable: one idea per slide, short phrases over sentences, and remove redundant labels.",
        "consistency": "Reuse a fixed color palette (2–3 colors), align icons to a grid, and keep the logo in the same corner across slides.",
        "suggestions": [
            {"title": "Strengthen the headline", "detail": f"Rewrite the title around “{kw[0]}” as a benefit, not a label.", "impact": "high"},
            {"title": "Increase whitespace", "detail": "Cut body text by ~30% and let the layout breathe.", "impact": "high"},
            {"title": "Fix visual hierarchy", "detail": "Bump headline size and de-emphasize secondary text.", "impact": "medium"},
            {"title": "Unify the palette", "detail": "Limit to 2–3 brand colors and apply consistently.", "impact": "medium"},
            {"title": "Align to a grid", "detail": "Snap images, icons and text blocks to a shared baseline grid.", "impact": "low"},
        ],
    }


def _slides_from_metrics(m: dict, notes: str) -> dict:
    """Build image-derived feedback from objective metrics (no vision key)."""
    suggestions: list[dict] = []

    # Aspect ratio — slides are usually 16:9.
    if m["aspect_ratio"] not in ("16:9", "~16:9"):
        suggestions.append({
            "title": "Check the aspect ratio",
            "detail": f"This image is {m['aspect_ratio']} ({m['orientation']}). Most decks present in 16:9 — reframe so nothing important is cropped on screen.",
            "impact": "high" if m["orientation"] != "landscape" else "medium",
        })

    # Brightness.
    if m["brightness"] < 25:
        suggestions.append({"title": "Lift the brightness", "detail": f"The slide reads quite dark (brightness {m['brightness']}/100). On a projector or bright room it will lose detail — raise exposure or use a lighter background.", "impact": "high"})
    elif m["brightness"] > 90:
        suggestions.append({"title": "Reduce glare", "detail": f"Very bright overall ({m['brightness']}/100). Add a subtle tint or panel behind text so it doesn't wash out.", "impact": "medium"})

    # Contrast — drives text legibility.
    if m["contrast"] < 30:
        suggestions.append({"title": "Increase contrast for legibility", "detail": f"Low tonal contrast ({m['contrast']}/100) suggests text and background are too close in value. Aim for a strong dark-on-light or light-on-dark separation (WCAG ≥ 4.5:1).", "impact": "high"})

    # Colorfulness — palette discipline.
    if m["colorfulness"] > 70:
        suggestions.append({"title": "Tame the palette", "detail": f"The slide is very colourful ({m['colorfulness']}/100). Limit to 2–3 brand colours plus a neutral so the message — not the colour — leads.", "impact": "medium"})
    elif m["colorfulness"] < 12:
        suggestions.append({"title": "Add one accent colour", "detail": f"Nearly monochrome ({m['colorfulness']}/100). A single accent colour can direct the eye to the key takeaway or CTA.", "impact": "low"})

    if m["megapixels"] < 0.4:
        suggestions.append({"title": "Use a higher-resolution export", "detail": f"At {m['megapixels']} MP this may look soft when projected. Export at least 1920×1080.", "impact": "medium"})

    suggestions.append({"title": "Apply the 3-second test", "detail": "Glance away, look back: whatever you read first should be the single most important point. If it isn't, enlarge that element.", "impact": "medium"})

    light = m["brightness"] >= 50
    return {
        "provider": "mock",
        "source": "image",
        "image_metrics": m,
        "first_impression": (
            f"Objectively, this is a {m['orientation']} {m['aspect_ratio']} image "
            f"({m['width']}×{m['height']}, {m['megapixels']} MP) with {m['brightness']}/100 brightness, "
            f"{m['contrast']}/100 contrast and {m['colorfulness']}/100 colourfulness. "
            f"The {'light' if light else 'dark'} key means text should be "
            f"{'dark and bold' if light else 'light and high-contrast'} to lead the eye."
        ),
        "layout": (
            f"With a {m['aspect_ratio']} frame, build on a 12-column grid and keep a ~5% safe margin. "
            + ("This portrait/square crop is unusual for a deck — confirm it isn't meant to be 16:9. " if m["orientation"] != "landscape" else "")
            + "Establish one clear focal point and group related elements."
        ),
        "typography": (
            f"Given {m['contrast']}/100 contrast, ensure headline weight and size separate it clearly from body "
            "(headline ≥ 2× body). Use one display + one clean sans, and keep body to short scannable phrases."
        ),
        "clarity": (
            "One idea per slide. " + ("Low contrast detected — verify body text is readable from the back of a room. " if m["contrast"] < 35 else "")
            + "Cut redundant labels and trim copy to the essential message."
        ),
        "consistency": (
            f"Detected dominant colours: {', '.join(m['palette']) if m['palette'] else 'n/a'}. "
            "Lock these into a fixed 2–3 colour palette, reuse across slides, and keep the logo in a consistent corner."
        ),
        "suggestions": suggestions[:6] if len(suggestions) >= 3 else suggestions + _mock_slides(notes or "slide")["suggestions"][: 3 - len(suggestions)],
    }


# ─────────────────────────────────────────────────────────────
# Live providers (best-effort; fall back to mock on any failure)
# ─────────────────────────────────────────────────────────────
def _call_llm_json(system: str, user: str) -> dict | None:
    """Call the configured LLM and parse a JSON object from the response."""
    try:
        import httpx

        provider = settings.AI_PROVIDER
        if provider == "openai" and settings.OPENAI_API_KEY:
            resp = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "response_format": {"type": "json_object"},
                },
                timeout=45,
            )
            resp.raise_for_status()
            return json.loads(resp.json()["choices"][0]["message"]["content"])

        if provider == "claude" and settings.ANTHROPIC_API_KEY:
            resp = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": settings.ANTHROPIC_MODEL,
                    "max_tokens": 2000,
                    "system": system + " Respond ONLY with a valid JSON object.",
                    "messages": [{"role": "user", "content": user}],
                },
                timeout=45,
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"]
            match = re.search(r"\{.*\}", text, re.S)
            return json.loads(match.group(0)) if match else None

        if provider == "gemini" and settings.GEMINI_API_KEY:
            resp = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{settings.GEMINI_MODEL}:generateContent",
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "system_instruction": {"parts": [{"text": system}]},
                    "contents": [{"role": "user", "parts": [{"text": user}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                },
                timeout=45,
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            match = re.search(r"\{.*\}", text, re.S)
            return json.loads(match.group(0)) if match else None
    except Exception:
        return None
    return None


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────
def generate_broll(script: str) -> dict:
    result = _call_llm_json(
        "You are an expert video editor. Given a script, break it into scenes and "
        "suggest b-roll. Favor VARIETY (mix wide, medium, close-up shots) and "
        "CONCEPTUAL/non-literal visuals (show the idea/feeling, not the words). "
        "Return JSON: {scenes:[{scene, broll_ideas[], camera_angles[], "
        "motion_graphics[], text_overlays[], concept_ideas[], shot_types[], "
        "stock_queries[] (short search/generation terms for stock libraries), "
        "gen_prompts:[{label, shot_type, approach, prompt, resolution, duration}]}]}.",
        script,
    )
    if result and "scenes" in result:
        result["provider"] = settings.AI_PROVIDER
        return result
    return _mock_broll(script)


def _storyboard_frame(prompt: str, label: str = "") -> str:
    """Deterministic animated storyboard frame (SVG data URL) — the zero-spend
    fallback when no image provider is configured. The subtle Ken-Burns scale +
    blinking REC dot make it read as a sample clip rather than a static slide."""
    safe_label = html.escape((label or "Sample b-roll").strip())[:60]
    lines = textwrap.wrap((prompt or "Sample b-roll frame").strip(), width=46)[:7]
    tspans = "".join(
        f'<tspan x="90" dy="{0 if i == 0 else 40}">{html.escape(line)}</tspan>'
        for i, line in enumerate(lines)
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">'
        '<defs>'
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#1e1b4b"/>'
        '<stop offset="0.55" stop-color="#111827"/>'
        '<stop offset="1" stop-color="#0f172a"/>'
        '</linearGradient>'
        '<radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">'
        '<stop offset="0" stop-color="#6366f1" stop-opacity="0.45"/>'
        '<stop offset="1" stop-color="#6366f1" stop-opacity="0"/>'
        '</radialGradient>'
        '</defs>'
        '<rect width="1280" height="720" fill="#0b1020"/>'
        '<g>'
        '<animateTransform attributeName="transform" type="scale" '
        'values="1;1.06;1" dur="8s" repeatCount="indefinite" additive="sum"/>'
        '<rect width="1280" height="720" fill="url(#bg)"/>'
        '<rect width="1280" height="720" fill="url(#glow)"/>'
        '</g>'
        # film sprocket bars
        '<rect x="0" y="0" width="1280" height="34" fill="#000" opacity="0.55"/>'
        '<rect x="0" y="686" width="1280" height="34" fill="#000" opacity="0.55"/>'
        + "".join(
            f'<rect x="{x}" y="10" width="26" height="14" rx="3" fill="#1f2937"/>'
            f'<rect x="{x}" y="696" width="26" height="14" rx="3" fill="#1f2937"/>'
            for x in range(24, 1280, 60)
        )
        # center play glyph
        + '<circle cx="640" cy="330" r="64" fill="#ffffff" opacity="0.12"/>'
        '<path d="M620 300 L676 330 L620 360 Z" fill="#ffffff" opacity="0.85"/>'
        # REC indicator (blinking)
        '<circle cx="92" cy="64" r="9" fill="#ef4444">'
        '<animate attributeName="opacity" values="1;0.2;1" dur="1.4s" '
        'repeatCount="indefinite"/></circle>'
        '<text x="112" y="70" font-family="Arial, sans-serif" font-size="22" '
        'font-weight="700" fill="#f8fafc">REC · SAMPLE</text>'
        # label chip
        f'<text x="1188" y="70" text-anchor="end" font-family="Arial, sans-serif" '
        f'font-size="22" font-weight="600" fill="#a5b4fc">{safe_label}</text>'
        # wrapped prompt at lower third
        f'<text x="90" y="468" font-family="Arial, sans-serif" font-size="30" '
        f'font-weight="500" fill="#e2e8f0">{tspans}</text>'
        '</svg>'
    )
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


# ─────────────────────────────────────────────────────────────
# B-roll sample CLIP generation (Google Veo, async job + poll)
# ─────────────────────────────────────────────────────────────
# Veo is a long-running operation (a clip takes ~1-2 min), so we start the job,
# hand the frontend a job_id, and let it poll. Jobs live in-process — fine for a
# single-instance demo. When Veo isn't available (no key, or the key lacks the
# paid Veo tier) we fall back to the animated storyboard frame so the feature
# always produces *something*.
_VIDEO_JOBS: dict[str, dict] = {}
_VIDEO_JOBS_MAX = 50
_GENAI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _veo_start(prompt: str, aspect_ratio: str = "16:9") -> str | None:
    """Kick off a Veo generation. Returns the long-running operation name."""
    try:
        import httpx

        resp = httpx.post(
            f"{_GENAI_BASE}/models/{settings.VEO_MODEL}:predictLongRunning",
            params={"key": settings.GEMINI_API_KEY},
            json={
                "instances": [{"prompt": prompt}],
                "parameters": {"aspectRatio": aspect_ratio, "numberOfVideos": 1},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("name")
    except Exception:
        return None


def _veo_operation(op_name: str) -> dict | None:
    """Fetch a long-running operation. None on transient/network error."""
    try:
        import httpx

        resp = httpx.get(
            f"{_GENAI_BASE}/{op_name}",
            params={"key": settings.GEMINI_API_KEY},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def _extract_video(response: dict) -> tuple[str | None, str | None]:
    """Walk a Veo operation response for a video URI or inline base64 bytes.
    Robust to the schema differences between Veo 2/3 (generatedSamples vs
    generatedVideos, uri vs videoUri, etc.). Returns (uri, base64_bytes)."""
    found = {"uri": None, "b64": None}

    def walk(o) -> None:
        if found["uri"] or found["b64"]:
            return
        if isinstance(o, dict):
            for k, v in o.items():
                if found["uri"] or found["b64"]:
                    return
                if k in ("uri", "videoUri") and isinstance(v, str) and v.startswith("http"):
                    found["uri"] = v
                    return
                if k in ("bytesBase64Encoded", "videoBytes") and isinstance(v, str) and v:
                    found["b64"] = v
                    return
                walk(v)
        elif isinstance(o, list):
            for it in o:
                walk(it)

    walk(response or {})
    return found["uri"], found["b64"]


def _download_video(uri: str) -> str | None:
    """Download a Veo file URI (needs the API key) → an mp4 data URL."""
    try:
        import httpx

        resp = httpx.get(
            uri,
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
            timeout=180,
            follow_redirects=True,
        )
        resp.raise_for_status()
        b64 = base64.b64encode(resp.content).decode("ascii")
        return f"data:video/mp4;base64,{b64}"
    except Exception:
        return None


def _video_job_view(job_id: str, job: dict) -> dict:
    return {
        "job_id": job_id,
        "status": job["status"],
        "provider": job.get("provider", "gemini"),
        "kind": job.get("kind", "video"),
        "data_url": job.get("data_url", ""),
        "error": job.get("error", ""),
    }


def start_broll_video(prompt: str, label: str = "", aspect_ratio: str = "16:9") -> dict:
    """Start a Veo clip job. Falls back to an instant storyboard frame when Veo
    is unavailable (not gemini / no key / start failed)."""
    prompt = (prompt or "").strip()
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        op = _veo_start(prompt, aspect_ratio)
        if op:
            if len(_VIDEO_JOBS) >= _VIDEO_JOBS_MAX:
                _VIDEO_JOBS.pop(next(iter(_VIDEO_JOBS)))  # evict oldest
            job_id = uuid.uuid4().hex
            _VIDEO_JOBS[job_id] = {
                "op": op, "status": "pending", "provider": "gemini",
                "kind": "video", "prompt": prompt, "label": label,
            }
            return _video_job_view(job_id, _VIDEO_JOBS[job_id])
    # Fallback: instant storyboard preview, already "done".
    return {
        "job_id": "", "status": "done", "provider": "mock",
        "kind": "storyboard", "data_url": _storyboard_frame(prompt, label),
        "error": "",
    }


def poll_broll_video(job_id: str) -> dict:
    """Advance a Veo job: check the operation, download the clip when ready."""
    job = _VIDEO_JOBS.get(job_id)
    if not job:
        return {
            "job_id": job_id, "status": "error", "provider": "gemini",
            "kind": "video", "data_url": "",
            "error": "Unknown or expired job.",
        }
    if job["status"] in ("done", "error"):
        return _video_job_view(job_id, job)

    op = _veo_operation(job["op"])
    if op is None or not op.get("done"):
        return _video_job_view(job_id, job)  # still pending / transient error

    if op.get("error"):
        job["status"] = "error"
        job["error"] = str(op["error"].get("message") or "Veo generation failed.")
        return _video_job_view(job_id, job)

    uri, b64 = _extract_video(op.get("response", {}))
    data_url = f"data:video/mp4;base64,{b64}" if b64 else (_download_video(uri) if uri else None)
    if data_url:
        job["status"] = "done"
        job["kind"] = "video"
        job["data_url"] = data_url
    else:
        job["status"] = "error"
        job["error"] = "The clip finished but no playable media was returned."
    return _video_job_view(job_id, job)


def analyze_storytelling(script: str) -> dict:
    result = _call_llm_json(
        "You are a storytelling coach for video. Score the script 0-100 on Hook, "
        "Pacing, Emotional impact, Curiosity, Call-to-action, plus an overall. Return "
        "JSON: {overall, scores:[{name, score, note}], suggestions[]}.",
        script,
    )
    if result and "scores" in result:
        result["provider"] = settings.AI_PROVIDER
        return result
    return _mock_storytelling(script)


def analyze_slides(notes: str, image_base64: str | None = None) -> dict:
    metrics = None
    if image_base64:
        try:
            from app.services.image_analysis import analyze_image

            metrics = analyze_image(image_base64)
        except Exception:
            metrics = None

    # Live vision provider (best effort). OpenAI and Gemini support images.
    _vision_ready = (
        (settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY)
        or (settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY)
    )
    if image_base64 and _vision_ready:
        live = _call_vision_json(notes, image_base64)
        if live and "suggestions" in live:
            live["provider"] = settings.AI_PROVIDER
            live["source"] = "image"
            if metrics:
                live["image_metrics"] = metrics
            return live

    # Image present but no usable vision result → objective metric-based report.
    if metrics:
        return _slides_from_metrics(metrics, notes)

    # Text-only path.
    result = _call_llm_json(
        "You are a presentation-design critic. Evaluate the described slide and return "
        "JSON: {first_impression, layout, typography, clarity, consistency, "
        "suggestions:[{title, detail, impact}]} with 3-5 suggestions ranked by impact.",
        notes,
    )
    if result and "suggestions" in result:
        result["provider"] = settings.AI_PROVIDER
        result["source"] = "text"
        return result
    return _mock_slides(notes)


_VISION_SYSTEM = (
    "You are a presentation-design critic. Return ONLY JSON: {first_impression, "
    "layout, typography, clarity, consistency, suggestions:[{title, detail, impact}]} "
    "with 3-5 suggestions ranked by impact."
)


def _call_vision_json(notes: str, image_base64: str) -> dict | None:
    """Send the image to a vision model (OpenAI or Gemini) and parse JSON."""
    try:
        import httpx

        data = image_base64.strip()

        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            raw = data.split(",", 1)[1] if data.startswith("data:") else data
            mime = "image/png"
            if data.startswith("data:"):
                mime = data[5:].split(";", 1)[0] or "image/png"
            resp = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{settings.GEMINI_MODEL}:generateContent",
                params={"key": settings.GEMINI_API_KEY},
                json={
                    "system_instruction": {"parts": [{"text": _VISION_SYSTEM}]},
                    "contents": [{"role": "user", "parts": [
                        {"text": notes or "Critique this slide."},
                        {"inline_data": {"mime_type": mime, "data": raw}},
                    ]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                },
                timeout=60,
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            match = re.search(r"\{.*\}", text, re.S)
            return json.loads(match.group(0)) if match else None

        if not data.startswith("data:"):
            data = f"data:image/png;base64,{data}"
        resp = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a presentation-design critic. Return ONLY JSON: {first_impression, layout, typography, clarity, consistency, suggestions:[{title, detail, impact}]} with 3-5 suggestions ranked by impact."},
                    {"role": "user", "content": [
                        {"type": "text", "text": notes or "Critique this slide."},
                        {"type": "image_url", "image_url": {"url": data}},
                    ]},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"])
    except Exception:
        return None
