"""AI service with provider fallback.

Strategy: a single interface (generate_broll / analyze_storytelling /
analyze_slides). When AI_PROVIDER is `openai` or `claude` and a key is
present, we call the real API. Otherwise — and on ANY error — we return
high-quality deterministic mock output so every feature is fully demoable
with zero spend and zero keys.

To wire a real provider later: set AI_PROVIDER + the matching key in .env.
"""
import json
import re

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
def _mock_broll(script: str) -> dict:
    scenes = _split_scenes(script)
    out = []
    for i, scene in enumerate(scenes, 1):
        kw = _keywords(scene)
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
                    "Drone / aerial pull-back for scale" if i == 1 else "Slow push-in",
                ],
                "motion_graphics": [
                    f"Kinetic text callout: “{kw[0].title()}”",
                    "Lower-third with the key statistic",
                ],
                "text_overlays": [
                    f"On-screen keyword: {kw[0].upper()}",
                    "Animated quote pull for the strongest line",
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
    except Exception:
        return None
    return None


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────
def generate_broll(script: str) -> dict:
    result = _call_llm_json(
        "You are an expert video editor. Given a script, break it into scenes and "
        "suggest b-roll. Return JSON: {scenes:[{scene, broll_ideas[], camera_angles[], "
        "motion_graphics[], text_overlays[]}]}.",
        script,
    )
    if result and "scenes" in result:
        result["provider"] = settings.AI_PROVIDER
        return result
    return _mock_broll(script)


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

    # Live vision provider (best effort). Only OpenAI path supports images here.
    if image_base64 and settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
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


def _call_vision_json(notes: str, image_base64: str) -> dict | None:
    """Send the image to an OpenAI vision model and parse a JSON object."""
    try:
        import httpx

        data = image_base64.strip()
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
