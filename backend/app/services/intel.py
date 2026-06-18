"""Free, key-less daily intelligence via public RSS/Atom feeds.

Pulls recent AI + video-editing news from free sources (Reddit, TechCrunch,
The Verge), filters to the last 3 days, and returns a digest. No API key, no
Gemini quota required — this powers the admin "Live feed" for free.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

# (feed url, category, friendly source name)
# Reliable, key-less feeds first; Reddit kept as best-effort (often 429s from
# shared server IPs — the fetcher simply skips any feed that fails).
FEEDS = [
    ("https://techcrunch.com/category/artificial-intelligence/feed/", "AI Tools", "TechCrunch"),
    ("https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "AI Tools", "The Verge"),
    ("https://nofilmschool.com/rss.xml", "Editing Trends", "No Film School"),
    ("https://feeds.arstechnica.com/arstechnica/index", "AI Tools", "Ars Technica"),
    ("https://www.reddit.com/r/artificial/.rss", "AI Tools", "r/artificial"),
    ("https://www.reddit.com/r/videoediting/.rss", "Editing Trends", "r/videoediting"),
]

_MAX_AGE = timedelta(days=3)
_UA = {"User-Agent": "EditMentorAI/1.0 (intelligence digest)"}


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _text(el) -> str:
    return (el.text or "").strip() if el is not None else ""


def _find(parent, name: str):
    for ch in parent:
        if _strip_ns(ch.tag) == name:
            return ch
    return None


def _parse_date(s: str):
    s = (s or "").strip()
    if not s:
        return None
    try:
        return parsedate_to_datetime(s)            # RSS: "Wed, 18 Jun 2026 ..."
    except Exception:
        pass
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))  # Atom ISO
    except Exception:
        return None


def _clean(html: str, limit: int = 220) -> str:
    txt = re.sub(r"<[^>]+>", " ", html or "")
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt[:limit] + ("…" if len(txt) > limit else "")


def _parse_feed(xml: str, category: str, source: str) -> list[dict]:
    out: list[dict] = []
    try:
        root = ET.fromstring(xml)
    except Exception:
        return out
    # RSS items live under channel/item; Atom entries are direct children.
    items = []
    for el in root.iter():
        if _strip_ns(el.tag) in ("item", "entry"):
            items.append(el)
    for it in items:
        title = _text(_find(it, "title"))
        # link: RSS <link>text</link>; Atom <link href="...">
        link_el = _find(it, "link")
        url = _text(link_el)
        if not url and link_el is not None:
            url = link_el.attrib.get("href", "")
        date_el = _find(it, "pubDate") or _find(it, "published") or _find(it, "updated")
        dt = _parse_date(_text(date_el))
        summary = _clean(_text(_find(it, "description")) or _text(_find(it, "summary")) or _text(_find(it, "content")))
        if not title:
            continue
        out.append({
            "title": title[:160], "summary": summary, "category": category,
            "source": source, "url": url, "_dt": dt,
        })
    return out


def fetch_free_digest(limit: int = 14) -> list[dict]:
    """Aggregate recent items across the free feeds (best-effort)."""
    import httpx

    now = datetime.now(timezone.utc)
    collected: list[dict] = []
    try:
        client = httpx.Client(timeout=8, headers=_UA, follow_redirects=True)
    except Exception:
        return []
    with client:
        for url, category, source in FEEDS:
            try:
                r = client.get(url)
                if r.status_code != 200:
                    continue
                for item in _parse_feed(r.text, category, source):
                    dt = item.pop("_dt", None)
                    if dt is not None:
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        if now - dt > _MAX_AGE:
                            continue
                        item["date"] = dt.date().isoformat()
                    else:
                        item["date"] = ""
                    collected.append(item)
            except Exception:
                continue

    # Newest first; items without a date sort last.
    collected.sort(key=lambda x: x.get("date") or "", reverse=True)
    return collected[:limit]
