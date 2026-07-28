"""Deterministic script analysis for the Content Workspace.

Everything here is computed from the text itself — no API key, no model
quota, no fabricated claims. Each result names the rule that produced it so
editors can judge the advice rather than trust it blindly.

Covers: length/runtime, readability (Flesch Reading Ease), pacing and
structure flags, filler words, repetition (repeated phrases + overused
words), hook critique, call-to-action detection, engagement heuristic, and
sections that exceed a target duration.
"""
from __future__ import annotations

import re

WORDS_PER_MINUTE = 150

FILLERS = ["um", "uh", "basically", "actually", "literally", "just", "really",
           "very", "kind of", "sort of", "you know", "i mean"]

CTA_PATTERNS = [
    "subscribe", "follow", "comment", "like this", "share", "link in bio",
    "link below", "download", "sign up", "book a", "dm ", "message me",
    "check out", "join", "click", "learn more", "swipe",
]

CTA_SUGGESTIONS = {
    "LinkedIn": "End with a question that invites replies (\"Which of these do you already do?\") — comments drive LinkedIn reach more than likes.",
    "Instagram": "Close with a save/share prompt (\"Save this for your next shoot\") — saves outperform likes for reach.",
    "Facebook": "Ask for a specific reply or tag (\"Tag someone who needs this\").",
    "YouTube": "Point to the next video by name rather than a generic \"subscribe\" — it lifts session time.",
    "TikTok": "Use a loop or follow-for-part-2 hook so the ending feeds the next view.",
}

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "so", "to", "of", "in", "on",
    "for", "with", "that", "this", "it", "is", "are", "was", "were", "be",
    "been", "as", "at", "by", "from", "you", "your", "i", "we", "our", "they",
    "he", "she", "his", "her", "them", "not", "no", "do", "does", "did", "have",
    "has", "had", "will", "would", "can", "could", "there", "their", "what",
    "when", "how", "why", "who", "all", "one", "about", "into", "than", "then",
    "more", "most", "some", "any", "up", "out", "just", "like", "get", "got",
}

# Target durations by format (seconds); 0 = no hard target.
FORMAT_TARGETS = {
    "reel script": 60, "instagram content": 60, "tiktok": 60,
    "linkedin post": 90, "facebook content": 90, "article": 0,
    "script": 0, "supporting asset": 0,
}


def word_count(text: str) -> int:
    return len([w for w in (text or "").split() if any(ch.isalnum() for ch in w)])


def runtime_str(words: int) -> str:
    total = round(words / WORDS_PER_MINUTE * 60) if words else 0
    return f"{total // 60}:{total % 60:02d}"


def runtime_seconds(words: int) -> int:
    return round(words / WORDS_PER_MINUTE * 60) if words else 0


def _syllables(word: str) -> int:
    """Rough syllable count — enough for a stable readability score."""
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    w = re.sub(r"(?:[^laeiouy]es|ed|[^laeiouy]e)$", "", w)
    w = re.sub(r"^y", "", w)
    return max(1, len(re.findall(r"[aeiouy]{1,2}", w)))


def readability(text: str, words: int, sentences: int) -> dict:
    """Flesch Reading Ease + a plain-English label."""
    if not words or not sentences:
        return {"score": 0, "label": "—", "note": "Not enough text to score."}
    syl = sum(_syllables(w) for w in text.split())
    score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syl / words)
    score = max(0, min(100, round(score, 1)))
    if score >= 80:
        label, note = "Very easy", "Reads conversationally — good for short-form and spoken delivery."
    elif score >= 60:
        label, note = "Easy", "Clear spoken register. This is the sweet spot for video scripts."
    elif score >= 45:
        label, note = "Moderate", "Slightly formal for spoken delivery — shorten sentences to lift it."
    else:
        label, note = "Hard", "Dense for narration. Break long sentences and swap complex words for plain ones."
    return {"score": score, "label": label, "note": note}


def repetition(text: str) -> dict:
    """Repeated 3-word phrases and overused content words."""
    words = [re.sub(r"[^a-z']", "", w.lower()) for w in text.split()]
    words = [w for w in words if w]
    phrases: dict[str, int] = {}
    for i in range(len(words) - 2):
        tri = " ".join(words[i:i + 3])
        if all(w in STOPWORDS for w in words[i:i + 3]):
            continue
        phrases[tri] = phrases.get(tri, 0) + 1
    repeated = sorted([(p, c) for p, c in phrases.items() if c > 1], key=lambda kv: -kv[1])[:6]

    counts: dict[str, int] = {}
    for w in words:
        if w in STOPWORDS or len(w) < 4:
            continue
        counts[w] = counts.get(w, 0) + 1
    total = max(1, len([w for w in words if w not in STOPWORDS]))
    overused = [
        {"word": w, "count": c, "pct": round(c / total * 100, 1)}
        for w, c in sorted(counts.items(), key=lambda kv: -kv[1])[:6]
        if c >= 4
    ]
    return {
        "phrases": [{"phrase": p, "count": c} for p, c in repeated],
        "overused": overused,
    }


def cta(text: str, platform: str, content_type: str) -> dict:
    low = text.lower()
    found = [p.strip() for p in CTA_PATTERNS if p in low]
    key = platform if platform in CTA_SUGGESTIONS else ""
    suggestion = CTA_SUGGESTIONS.get(key, "Close with one specific action — a question, a save prompt, or a named next step. Generic \"like and subscribe\" underperforms.")
    return {
        "present": bool(found),
        "found": found[:4],
        "suggestion": suggestion,
        "note": ("A call-to-action is present — check it names ONE action, not three."
                 if found else "No call-to-action detected. Viewers act when told exactly what to do once."),
    }


def engagement(text: str, words: int, sentences: list[str], flags_count: int,
               read_score: float, has_cta: bool) -> dict:
    """Composite 0–100 heuristic. Explicitly a rule-of-thumb, not a prediction."""
    score = 50
    reasons: list[str] = []

    hook = sentences[0] if sentences else ""
    hw = word_count(hook)
    if hook and 4 <= hw <= 16:
        score += 12; reasons.append("Tight opening line (+)")
    elif hw > 22:
        score -= 10; reasons.append("Opening line is long (−)")
    if re.search(r"\d", hook):
        score += 8; reasons.append("Hook contains a specific number (+)")
    if re.match(r"^(hi|hey|hello|welcome|good morning)", hook.strip(), re.I):
        score -= 12; reasons.append("Opens with a greeting (−)")

    if "?" in text:
        score += 6; reasons.append("Asks the viewer a question (+)")
    if has_cta:
        score += 8; reasons.append("Has a call-to-action (+)")
    else:
        score -= 8; reasons.append("No call-to-action (−)")

    lens = [word_count(s) for s in sentences] or [0]
    if len(lens) > 3:
        spread = max(lens) - min(lens)
        if spread >= 12:
            score += 8; reasons.append("Varied sentence length keeps rhythm (+)")
        else:
            score -= 6; reasons.append("Uniform sentence length flattens pacing (−)")

    if read_score >= 60:
        score += 8; reasons.append("Reads easily aloud (+)")
    elif read_score < 45:
        score -= 8; reasons.append("Dense for narration (−)")

    score -= min(12, flags_count * 4)
    if flags_count:
        reasons.append(f"{flags_count} pacing/structure flag(s) (−)")

    score = max(0, min(100, score))
    band = "Strong" if score >= 70 else "Workable" if score >= 50 else "Needs work"
    return {"score": score, "band": band, "reasons": reasons,
            "note": "Heuristic score from structure, hook, readability and CTA — not a performance prediction."}


def over_duration(paragraphs: list[str], target_seconds: int) -> dict:
    """Cumulative runtime per section; flags where the target is exceeded."""
    if not target_seconds:
        return {"target": 0, "sections": [], "over_by": 0,
                "note": "No duration target for this format."}
    running = 0
    sections = []
    over_at = None
    for i, p in enumerate(paragraphs, 1):
        w = word_count(p)
        running += runtime_seconds(w)
        over = running > target_seconds
        if over and over_at is None:
            over_at = i
        sections.append({
            "n": i, "words": w,
            "cumulative": f"{running // 60}:{running % 60:02d}",
            "over": over, "text": p[:120],
        })
    return {
        "target": target_seconds,
        "target_label": f"{target_seconds // 60}:{target_seconds % 60:02d}",
        "sections": sections,
        "over_by": max(0, running - target_seconds),
        "over_at": over_at,
        "note": (f"Section {over_at} is where the script passes the {target_seconds}s target — cut before here."
                 if over_at else "Script fits the target duration."),
    }


def analyze(body: str, platform: str = "", content_type: str = "",
            target_seconds: int | None = None) -> dict:
    words = word_count(body)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", body) if s.strip()]
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()] or sentences

    flags: list[dict] = []
    long_s = [s for s in sentences if word_count(s) > 28]
    if long_s:
        flags.append({"kind": "Pacing",
                      "detail": f"{len(long_s)} sentence(s) run over 28 words — long on camera. Split so each line lands one idea.",
                      "sample": long_s[0][:160]})
    long_p = [p for p in paragraphs if word_count(p) > 120]
    if long_p:
        flags.append({"kind": "Structure",
                      "detail": f"{len(long_p)} block(s) exceed ~120 words with no break — a stretch with no visual change. Plan b-roll or a punch-in.",
                      "sample": long_p[0][:160]})
    found_fillers = [f for f in FILLERS if re.search(rf"\b{re.escape(f)}\b", body, re.I)]
    if found_fillers:
        flags.append({"kind": "Tighten",
                      "detail": "Filler words present: " + ", ".join(found_fillers[:6]) + ". Cutting these raises idea-density per second.",
                      "sample": ""})

    hook = sentences[0] if sentences else ""
    hook_notes: list[str] = []
    if hook:
        hw = word_count(hook)
        if hw > 20:
            hook_notes.append(f"The opening line is {hw} words — tighten toward 8–14 so it lands before the scroll.")
        if not re.search(r"\d", hook):
            hook_notes.append("No number or concrete specific in the hook — specifics buy credibility.")
        if re.match(r"^(hi|hey|hello|welcome|good morning)", hook.strip(), re.I):
            hook_notes.append("Opens with a greeting — delete it and start on the most surprising line.")
        if not hook_notes:
            hook_notes.append("Opening line looks tight — check it pairs with motion or bold text in the first second.")
    else:
        hook_notes.append("No script body yet — paste the script to analyze the hook.")

    read = readability(body, words, len(sentences))
    rep = repetition(body)
    cta_info = cta(body, platform, content_type)
    eng = engagement(body, words, sentences, len(flags), read["score"], cta_info["present"])

    if target_seconds is None:
        target_seconds = FORMAT_TARGETS.get((content_type or "").lower(), 0)
    dur = over_duration(paragraphs, target_seconds)

    SHOTS = ["Medium — speaker on camera", "B-roll — illustrate the point",
             "Close-up — detail or reaction", "Wide — establish context",
             "Insert — screen / product / hands", "Punch-in — emphasis"]
    beats = [{
        "n": i + 1, "text": p[:180], "shot": SHOTS[i % len(SHOTS)],
        "words": word_count(p), "runtime": runtime_str(word_count(p)),
    } for i, p in enumerate(paragraphs[:12])]

    return {
        "word_count": words,
        "runtime": runtime_str(words),
        "runtime_seconds": runtime_seconds(words),
        "sentences": len(sentences),
        "paragraphs": len(paragraphs),
        "avg_sentence_words": round(words / len(sentences), 1) if sentences else 0,
        "readability": read,
        "repetition": rep,
        "cta": cta_info,
        "engagement": eng,
        "duration": dur,
        "flags": flags,
        "hook": {"line": hook[:200], "notes": hook_notes},
        "beats": beats,
        "method": "Deterministic analysis of the script text (structure, readability, repetition, CTA). No AI key required — advice is rule-based, so judge it against the piece.",
    }


# ── Selection actions (highlight a paragraph → act on it) ────
def tighten(text: str, ratio: float = 0.3) -> dict:
    """Genuinely shorten a passage by removing fillers, hedges and
    redundant adverbs — extractive, so the author's words are preserved."""
    original_words = word_count(text)
    out = text
    for f in FILLERS:
        out = re.sub(rf"\b{re.escape(f)}\b[,]?\s*", "", out, flags=re.I)
    out = re.sub(r"\b(very|quite|rather|somewhat|extremely|incredibly|truly|simply)\s+", "", out, flags=re.I)
    out = re.sub(r"\b(in order to)\b", "to", out, flags=re.I)
    out = re.sub(r"\b(due to the fact that|owing to the fact that)\b", "because", out, flags=re.I)
    out = re.sub(r"\b(at this point in time|at the present time)\b", "now", out, flags=re.I)
    out = re.sub(r"\b(a large number of|a great deal of)\b", "many", out, flags=re.I)
    out = re.sub(r"\b(is able to|are able to)\b", "can", out, flags=re.I)
    # Only drop "that is/are" before a participle ("that are running" → "running");
    # dropping it before an adjective would break grammar ("things important").
    out = re.sub(r"\b(?:that|which)\s+(?:is|are|was|were)\s+(\w+(?:ing|ed))\b", r"\1", out, flags=re.I)
    out = re.sub(r"\s{2,}", " ", out).strip()

    # If still above the target, drop the least information-dense sentences.
    target = max(1, int(original_words * (1 - ratio)))
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", out) if s.strip()]
    if word_count(out) > target and len(sents) > 1:
        scored = []
        for i, s in enumerate(sents):
            ws = [w.lower() for w in re.findall(r"[a-z']+", s.lower())]
            content = [w for w in ws if w not in STOPWORDS]
            density = len(set(content)) / max(1, len(ws))
            scored.append((density + (0.25 if i == 0 or i == len(sents) - 1 else 0), i, s))
        scored.sort(reverse=True)
        keep: list[tuple[int, str]] = []
        running = 0
        for _, i, s in scored:
            if running >= target and keep:
                break
            keep.append((i, s))
            running += word_count(s)
        out = " ".join(s for _, s in sorted(keep))

    new_words = word_count(out)
    return {
        "action": "Tighten",
        "text": out,
        "before_words": original_words,
        "after_words": new_words,
        "saved_pct": round((1 - new_words / original_words) * 100) if original_words else 0,
        "before_runtime": runtime_str(original_words),
        "after_runtime": runtime_str(new_words),
        "method": "Removed fillers, hedges and wordy constructions, then dropped the lowest-density sentences. Your wording is preserved — review before using.",
    }


def broll_for(text: str) -> dict:
    """Concrete b-roll suggestions from the passage's own key nouns, with
    ready-made stock-search links (no generation needed)."""
    words = [w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'-]{3,}", text)]
    freq: dict[str, int] = {}
    for w in words:
        if w in STOPWORDS:
            continue
        freq[w] = freq.get(w, 0) + 1
    keys = [w for w, _ in sorted(freq.items(), key=lambda kv: -kv[1])[:6]]

    SHOT_TYPES = ["Wide establishing", "Medium action", "Close-up detail",
                  "Macro texture", "Over-the-shoulder", "Slow push-in"]
    ABSTRACT = {
        "growth": "plant timelapse / city construction / rising graph on a screen",
        "time": "clock hands, calendar pages, long-exposure traffic",
        "team": "hands meeting over a table, group at a whiteboard",
        "focus": "single desk lamp in a dark room, narrow depth-of-field",
        "money": "card tap, ledger close-up, coins stacking",
        "delegation": "handing over a folder, passing a baton, shared screen",
        "trust": "handshake in soft light, eye contact in conversation",
        "pressure": "clamp tightening, boiling kettle, deadline clock",
    }
    ideas = []
    for i, k in enumerate(keys):
        concept = next((v for a, v in ABSTRACT.items() if a in k or k in a), "")
        ideas.append({
            "keyword": k,
            "shot": SHOT_TYPES[i % len(SHOT_TYPES)],
            "idea": concept or f"literal coverage of \"{k}\" — show the thing being described",
            "pexels": f"https://www.pexels.com/search/videos/{k}/",
            "pixabay": f"https://pixabay.com/videos/search/{k}/",
        })
    return {
        "action": "B-roll",
        "ideas": ideas,
        "method": "Key nouns extracted from the passage, paired with shot types and stock-search links. Abstract terms get a visual-metaphor suggestion.",
    }
