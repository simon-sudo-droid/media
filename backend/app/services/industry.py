"""Industry Monitoring — the Daily AI Video Editing Update.

Continuously monitors trusted sources (official blogs, AI news, stock/B-roll
providers, communities) via their public RSS/Atom feeds, classifies fresh
items into the report sections, deduplicates against everything already
reported on previous days, and persists one structured digest per date.

Design constraints honored here:
- Key-less and free: pure RSS/Atom over httpx; any feed that fails is skipped.
- Never speculative: every item is a real headline + link from the source;
  the heuristic "why it matters / recommendation" lines are derived from the
  item's own text and clearly framed as guidance.
- No duplicate reporting: reported URLs are remembered (IndustrySeen).
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import IndustryDigest, IndustrySeen, IndustryTool
from app.services.intel import _parse_feed  # shared, hardened feed parser

_UA = {"User-Agent": "EditMentorAI/1.0 (industry monitoring)"}
_MAX_AGE = timedelta(days=7)
_PER_SECTION = 8

# ── Trusted sources ──────────────────────────────────────────────
# (feed_url, source_name, group). Feeds are best-effort: dead/missing feeds
# are skipped silently. Sources without a usable feed are still listed in
# the digest's Sources section (SOURCE_LINKS) so users can check them.
FEEDS = [
    # AI news
    ("https://techcrunch.com/category/artificial-intelligence/feed/", "TechCrunch AI", "news"),
    ("https://www.therundown.ai/feed", "The Rundown AI", "news"),
    ("https://www.bensbites.com/feed", "Ben's Bites", "news"),
    ("https://www.futuretools.io/news/rss.xml", "FutureTools", "news"),
    # Official vendor blogs (updates to existing tools)
    ("https://blog.adobe.com/en/rss.xml", "Adobe Blog", "vendor"),
    ("https://runwayml.com/blog/rss.xml", "Runway", "vendor"),
    ("https://www.descript.com/blog/rss.xml", "Descript", "vendor"),
    ("https://www.veed.io/blog/rss.xml", "VEED", "vendor"),
    ("https://www.canva.com/newsroom/news/feed/", "Canva Newsroom", "vendor"),
    ("https://lumalabs.ai/blog/rss.xml", "Luma AI", "vendor"),
    # B-roll & stock footage
    ("https://www.storyblocks.com/blog/feed", "Storyblocks", "broll"),
    ("https://artlist.io/blog/feed/", "Artlist", "broll"),
    ("https://envato.com/blog/feed/", "Envato", "broll"),
    ("https://www.pexels.com/blog/feed/", "Pexels", "broll"),
    # Community & emerging trends
    ("https://www.reddit.com/r/ArtificialIntelligence/.rss", "r/ArtificialIntelligence", "community"),
    ("https://www.reddit.com/r/VideoEditing/.rss", "r/VideoEditing", "community"),
    ("https://www.reddit.com/r/OpenAI/.rss", "r/OpenAI", "community"),
    ("https://www.producthunt.com/feed", "Product Hunt", "community"),
]

# Everything we monitor, for the Sources section (feed or not).
SOURCE_LINKS = [
    {"group": "AI News", "name": "The Rundown AI", "url": "https://www.therundown.ai"},
    {"group": "AI News", "name": "Ben's Bites", "url": "https://www.bensbites.com"},
    {"group": "AI News", "name": "There's An AI For That", "url": "https://theresanaiforthat.com"},
    {"group": "AI News", "name": "FutureTools", "url": "https://futuretools.io"},
    {"group": "AI News", "name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/"},
    {"group": "AI Video Editing", "name": "Runway Blog", "url": "https://runwayml.com/blog"},
    {"group": "AI Video Editing", "name": "Adobe Blog", "url": "https://blog.adobe.com"},
    {"group": "AI Video Editing", "name": "CapCut Resources", "url": "https://www.capcut.com/resource"},
    {"group": "AI Video Editing", "name": "Descript Blog", "url": "https://www.descript.com/blog"},
    {"group": "AI Video Editing", "name": "VEED Blog", "url": "https://www.veed.io/blog"},
    {"group": "AI Video Editing", "name": "Canva Newsroom", "url": "https://www.canva.com/newsroom/news/"},
    {"group": "AI Video Editing", "name": "Luma AI Blog", "url": "https://lumalabs.ai/blog"},
    {"group": "AI Video Editing", "name": "Pika Blog", "url": "https://pika.art/blog"},
    {"group": "AI Video Editing", "name": "Kling AI", "url": "https://klingai.com"},
    {"group": "AI B-roll & Stock", "name": "Storyblocks Blog", "url": "https://www.storyblocks.com/blog"},
    {"group": "AI B-roll & Stock", "name": "Artlist Blog", "url": "https://artlist.io/blog"},
    {"group": "AI B-roll & Stock", "name": "Envato Blog", "url": "https://envato.com/blog/"},
    {"group": "AI B-roll & Stock", "name": "Pexels Blog", "url": "https://www.pexels.com/blog/"},
    {"group": "Community & Trends", "name": "r/ArtificialIntelligence", "url": "https://www.reddit.com/r/ArtificialIntelligence/"},
    {"group": "Community & Trends", "name": "r/VideoEditing", "url": "https://www.reddit.com/r/VideoEditing/"},
    {"group": "Community & Trends", "name": "r/OpenAI", "url": "https://www.reddit.com/r/OpenAI/"},
    {"group": "Community & Trends", "name": "Product Hunt", "url": "https://www.producthunt.com"},
]

# Curated starter set for the running "Tools Worth Testing" list. Facts kept
# deliberately stable (what the tool is, not version claims).
SEED_TOOLS = [
    {"name": "Runway", "description": "AI video generation and editing suite (text/image-to-video, inpainting, motion tools).", "use_case": "Generating b-roll, cleaning shots, experimental visuals.", "advantages": "Broad AI toolset; fast iteration; industry adoption.", "limitations": "Credit-based pricing; generated clips need curation.", "priority": "High", "url": "https://runwayml.com"},
    {"name": "Descript", "description": "Text-based video/podcast editor — edit media by editing the transcript.", "use_case": "Interview/podcast cuts, filler-word removal, quick social clips.", "advantages": "Massive speed-up on talking content; overdub tools.", "limitations": "Less control for fine visual cutting.", "priority": "High", "url": "https://www.descript.com"},
    {"name": "OpusClip", "description": "AI repurposing: turns long-form video into scored short-form clips.", "use_case": "Podcast/webinar → Shorts/Reels/TikTok pipelines.", "advantages": "Automates clip selection + captions; virality scoring.", "limitations": "Picks still need editorial judgment.", "priority": "High", "url": "https://www.opus.pro"},
    {"name": "CapCut", "description": "Free editor with strong AI captions, templates and short-form workflow.", "use_case": "Fast vertical-video edits and auto-captions.", "advantages": "Free tier; template speed; platform-native styles.", "limitations": "Desktop pro features vary by region/plan.", "priority": "High", "url": "https://www.capcut.com"},
    {"name": "ElevenLabs", "description": "AI voice generation and dubbing.", "use_case": "VO drafts, multilingual dubs, voice cleanup.", "advantages": "Best-in-class voice quality; fast.", "limitations": "Licensing/disclosure considerations for client work.", "priority": "Medium", "url": "https://elevenlabs.io"},
    {"name": "Luma Dream Machine", "description": "Text/image-to-video generation from Luma AI.", "use_case": "Concept shots and AI b-roll experiments.", "advantages": "Strong motion coherence.", "limitations": "Clip length limits; needs upscaling for delivery.", "priority": "Medium", "url": "https://lumalabs.ai"},
    {"name": "Topaz Video AI", "description": "AI upscaling, denoising and frame interpolation.", "use_case": "Rescuing low-res/noisy footage; smooth slow-mo.", "advantages": "Production-quality results.", "limitations": "Slow renders; paid license.", "priority": "Medium", "url": "https://www.topazlabs.com/topaz-video-ai"},
]

# ── Classification heuristics ────────────────────────────────────
VENDOR_NAMES = {
    "Runway": ["runway"],
    "Adobe Premiere Pro / Firefly": ["adobe", "premiere", "firefly"],
    "CapCut": ["capcut"],
    "Descript": ["descript"],
    "VEED": ["veed"],
    "Canva": ["canva"],
    "Luma AI": ["luma"],
    "Pika": ["pika"],
    "Kling AI": ["kling"],
}

KW_VIDEO = ["video", "edit", "editing", "editor", "footage", "b-roll", "broll", "film", "clip", "creator", "content", "youtube", "tiktok", "shorts", "reels", "motion", "caption", "subtitle", "voice", "audio", "render"]
KW_NEW_TOOL = ["launch", "introducing", "unveil", "debut", "announc", "releases", "released", "new tool", "new app", "beta", "now available"]
KW_UPDATE = ["update", "new feature", "version", "v2", "improve", "faster", "adds", "rolls out", "upgrade", "integration"]
KW_BROLL = ["stock", "footage", "b-roll", "broll", "library", "asset", "template", "collection"]
KW_WORKFLOW = ["workflow", "automat", "plugin", "integrat", "prompt", "agent", "how to", "guide", "tip", "speed up", "pipeline", "shortcut"]
KW_TREND = ["trend", "viral", "style", "transition", "storytelling", "short-form", "shorts", "tiktok", "captions", "aesthetic", "popular"]
KW_NEWS = ["openai", "google", "gemini", "anthropic", "claude", "meta", "gpt", "model", "funding", "acquisition", "acquire", "partnership", "sora", "veo"]


def _hit(text: str, kws: list[str]) -> bool:
    t = text.lower()
    return any(k in t for k in kws)


def _vendor_for(item: dict) -> str | None:
    text = f"{item.get('source','')} {item.get('title','')}".lower()
    for vendor, kws in VENDOR_NAMES.items():
        if any(k in text for k in kws):
            return vendor
    return None


def _fetch_all() -> list[dict]:
    import httpx

    now = datetime.now(timezone.utc)
    items: list[dict] = []
    try:
        client = httpx.Client(timeout=6, headers=_UA, follow_redirects=True)
    except Exception:
        return []
    with client:
        for url, source, group in FEEDS:
            try:
                r = client.get(url)
                if r.status_code != 200:
                    continue
                for it in _parse_feed(r.text, group, source)[:20]:
                    dt = it.pop("_dt", None)
                    if dt is not None:
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        if now - dt > _MAX_AGE:
                            continue
                        it["date"] = dt.date().isoformat()
                    else:
                        it["date"] = ""
                    it["group"] = group
                    if it.get("url"):
                        items.append(it)
            except Exception:
                continue
    items.sort(key=lambda x: x.get("date") or "", reverse=True)
    return items


def _pick(items: list[dict], used: set[str], pred, limit: int = _PER_SECTION) -> list[dict]:
    out = []
    for it in items:
        if it["url"] in used:
            continue
        if pred(it):
            used.add(it["url"])
            out.append({k: it[k] for k in ("title", "summary", "source", "url", "date")})
            if len(out) >= limit:
                break
    return out


def _ensure_seed_tools(db: Session) -> None:
    existing = {t.name for t in db.scalars(select(IndustryTool)).all()}
    for t in SEED_TOOLS:
        if t["name"] not in existing:
            db.add(IndustryTool(**t))
    db.commit()


def _auto_add_tools(db: Session, new_tools: list[dict], today: str) -> None:
    """Promote strong new-tool finds onto the running list (conservatively)."""
    existing = {t.name.lower() for t in db.scalars(select(IndustryTool)).all()}
    for it in new_tools[:3]:
        name = it["title"].split(":")[0].split("—")[0].strip()[:80]
        if not name or name.lower() in existing:
            continue
        db.add(IndustryTool(
            name=name,
            description=it.get("summary") or it["title"],
            use_case="Per the announcement — evaluate against our short-form / b-roll pipeline.",
            advantages="Newly released; capabilities as described in the linked announcement.",
            limitations=f"Unverified by the team yet (surfaced {today}) — run a hands-on test before client use.",
            priority="Medium",
            url=it.get("url", ""),
        ))
        existing.add(name.lower())
    db.commit()


def _recommendations(sections: dict) -> list[dict]:
    """Actionable, honest guidance derived from today's real items."""
    recs: list[dict] = []
    for it in sections["updates"][:2]:
        recs.append({
            "title": f"Review: {it['title']}",
            "verdict": "Worth testing" if _hit(it["title"] + it["summary"], KW_VIDEO) else "Monitor",
            "detail": f"Official update from {it.get('tool') or it['source']}. If it touches our pipeline, schedule a 30-minute hands-on test before adopting in client work.",
            "impact": "Speed/quality — verify in a test project first.",
            "url": it["url"],
        })
    for it in sections["new_tools"][:2]:
        recs.append({
            "title": f"Evaluate: {it['title']}",
            "verdict": "Test — not production-ready until verified",
            "detail": "Newly announced; capabilities per the linked announcement. Assign one editor to trial it on a non-client project.",
            "impact": "Potential automation/speed gain if it holds up.",
            "url": it["url"],
        })
    for it in sections["workflow"][:1]:
        recs.append({
            "title": f"Try this workflow: {it['title']}",
            "verdict": "Adopt if it fits",
            "detail": f"From {it['source']} — low-risk process improvement; share results in the team channel.",
            "impact": "Editing speed / consistency.",
            "url": it["url"],
        })
    if not recs:
        recs.append({
            "title": "Quiet day — no adoption decisions needed",
            "verdict": "No action",
            "detail": "No significant releases or updates crossed the monitored sources today. Keep current workflows.",
            "impact": "—",
            "url": "",
        })
    return recs


def build_digest(db: Session, today: str) -> dict:
    """Fetch, dedupe, classify and persist today's digest."""
    _ensure_seed_tools(db)

    items = _fetch_all()

    # Cross-day dedup: drop anything already reported in a PREVIOUS digest.
    # (Forget today's own URLs first so a same-day refresh can rebuild.)
    for row_ in db.scalars(select(IndustrySeen).where(IndustrySeen.first_seen == today)).all():
        db.delete(row_)
    db.commit()
    seen_urls = set(db.scalars(select(IndustrySeen.url)).all())
    items = [it for it in items if it["url"] not in seen_urls]

    used: set[str] = set()
    updates_raw = _pick(items, used, lambda it: _vendor_for(it) is not None or (it["group"] == "vendor"))
    for it in updates_raw:
        it["tool"] = _vendor_for(it) or it["source"]
    new_tools = _pick(items, used, lambda it: _hit(it["title"], KW_NEW_TOOL) and _hit(it["title"] + it["summary"], KW_VIDEO + ["ai"]))
    for it in new_tools:
        it["why"] = "New release relevant to AI-assisted video work — see the announcement for capabilities."
        it["who"] = "Editors and content creators exploring AI-assisted workflows."
        it["worth_testing"] = "Yes — hands-on trial recommended" if _hit(it["title"] + it["summary"], KW_VIDEO) else "Optional — monitor first"
    broll = _pick(items, used, lambda it: it["group"] == "broll" or _hit(it["title"] + it["summary"], KW_BROLL))
    workflow = _pick(items, used, lambda it: _hit(it["title"] + it["summary"], KW_WORKFLOW))
    trending = _pick(items, used, lambda it: it["group"] == "community" or _hit(it["title"] + it["summary"], KW_TREND))
    news = _pick(items, used, lambda it: it["group"] == "news" or _hit(it["title"], KW_NEWS))

    sections = {
        "news": news,
        "new_tools": new_tools,
        "updates": updates_raw,
        "broll": broll,
        "workflow": workflow,
        "trending": trending,
    }
    sections["recommendations"] = _recommendations(sections)

    _auto_add_tools(db, new_tools, today)
    tools = [
        {
            "tool": t.name, "description": t.description, "use_case": t.use_case,
            "advantages": t.advantages, "limitations": t.limitations,
            "priority": t.priority, "url": t.url,
        }
        for t in db.scalars(select(IndustryTool).order_by(IndustryTool.added_at.desc())).all()[:14]
    ]

    payload = {
        "date": today,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **sections,
        "tools_worth_testing": tools,
        "sources": SOURCE_LINKS,
        "item_count": sum(len(v) for v in sections.values() if isinstance(v, list)),
    }

    # Remember every reported URL so tomorrow never repeats it.
    for section in ("news", "new_tools", "updates", "broll", "workflow", "trending"):
        for it in payload[section]:
            if it.get("url"):
                db.add(IndustrySeen(url=it["url"][:600], first_seen=today))
    row = db.scalar(select(IndustryDigest).where(IndustryDigest.digest_date == today))
    if row:
        row.payload = json.dumps(payload)
    else:
        db.add(IndustryDigest(digest_date=today, payload=json.dumps(payload)))
    db.commit()
    return payload
