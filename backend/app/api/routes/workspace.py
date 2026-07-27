"""Content Workspace — real work content, learning log/library, progress,
and weekly learning recommendations."""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import LearningEntry, User, WorkContent, WorkContentVersion

router = APIRouter(prefix="/workspace", tags=["workspace"])

# Talking-head narration pace — used for the runtime estimate on scripts.
WORDS_PER_MINUTE = 150

STATUSES = ["Draft", "Ready for Edit", "In Editing", "In Review", "Published"]

# Tool-ish tags used for the "new tools learned" progress stat.
TOOL_TAGS = {
    "runway", "premiere pro", "premiere", "capcut", "descript", "after effects",
    "davinci", "davinci resolve", "pika", "luma", "elevenlabs", "topaz", "canva",
    "veed", "opus", "opusclip", "kling", "firefly", "midjourney", "sora",
}


# ── Current Content Workspace ────────────────────────────────
class ContentIn(BaseModel):
    category: str = Field(default="leadership", max_length=30)
    title: str = Field(min_length=1, max_length=255)
    content_type: str = Field(default="Script", max_length=60)
    platform: str = Field(default="", max_length=60)
    body: str = ""
    status: str = Field(default="Draft", max_length=30)
    notes: str = ""
    links: str = ""
    owner: str = Field(default="", max_length=120)
    due_date: str = Field(default="", max_length=20)


class ContentPatch(BaseModel):
    title: str | None = None
    content_type: str | None = None
    platform: str | None = None
    body: str | None = None
    status: str | None = None
    notes: str | None = None
    links: str | None = None
    owner: str | None = None
    due_date: str | None = None


def _doc_name(raw: str) -> dict:
    """Parse a links line into {name, url}.

    Accepts "Real doc name | https://…"; otherwise derives a readable name
    from the URL (last path segment or host) so the UI never shows "Doc 1".
    """
    line = raw.strip()
    name = ""
    url = line
    if "|" in line:
        left, right = line.split("|", 1)
        if right.strip().startswith("http"):
            name, url = left.strip(), right.strip()
        elif left.strip().startswith("http"):
            url, name = left.strip(), right.strip()
    if not name:
        cleaned = url.split("?")[0].rstrip("/")
        tail = cleaned.rsplit("/", 1)[-1] if "/" in cleaned else cleaned
        # Google Docs URLs end in /edit or a long id — fall back to the host.
        if not tail or tail in ("edit", "view", "preview") or len(tail) > 48:
            host = url.split("//")[-1].split("/")[0].replace("www.", "")
            name = host or "Document"
        else:
            name = tail.replace("-", " ").replace("_", " ")
    return {"name": name[:80], "url": url}


def _word_count(text: str) -> int:
    return len([w for w in (text or "").split() if any(ch.isalnum() for ch in w)])


def _runtime(words: int) -> str:
    if not words:
        return "0:00"
    total = round(words / WORDS_PER_MINUTE * 60)
    return f"{total // 60}:{total % 60:02d}"


def _content_out(c: WorkContent, db: Session | None = None) -> dict:
    words = _word_count(c.body)
    out = {
        "id": c.id, "category": c.category, "title": c.title,
        "content_type": c.content_type, "platform": c.platform, "body": c.body,
        "status": c.status, "notes": c.notes,
        "links": [_doc_name(l) for l in (c.links or "").splitlines() if l.strip()],
        "owner": c.owner or "", "due_date": c.due_date or "",
        "word_count": words, "runtime": _runtime(words),
        "updated_at": c.updated_at.isoformat() if c.updated_at else "",
    }
    if db is not None:
        out["version_count"] = len(db.scalars(
            select(WorkContentVersion.id).where(WorkContentVersion.content_id == c.id)
        ).all())
        # Techniques logged against this content (learning → doing link).
        rows = db.execute(
            select(LearningEntry, User.full_name)
            .join(User, User.id == LearningEntry.user_id)
            .where(LearningEntry.content_id == c.id)
            .order_by(LearningEntry.id.desc())
        ).all()
        out["techniques"] = [
            {"id": e.id, "title": e.title, "url": e.url, "user_name": n or "",
             "tags": [t.strip() for t in (e.tags or "").split(",") if t.strip()],
             "apply_plan": e.apply_plan}
            for e, n in rows
        ]
    return out


@router.get("/content")
def list_content(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(WorkContent).order_by(WorkContent.updated_at.desc())).all()
    return [_content_out(c, db) for c in rows]


@router.post("/content", status_code=201)
def add_content(body: ContentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.category not in ("leadership", "case_study"):
        raise HTTPException(400, "category must be leadership or case_study")
    row = WorkContent(**body.model_dump(), created_by=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _content_out(row, db)


@router.patch("/content/{cid}")
def update_content(cid: int, body: ContentPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    data = body.model_dump(exclude_none=True)
    # Snapshot the previous script before overwriting it, so a bad edit is
    # always recoverable from version history.
    if "body" in data and data["body"] != row.body:
        db.add(WorkContentVersion(content_id=row.id, body=row.body or "", edited_by=user.id))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _content_out(row, db)


@router.delete("/content/{cid}", status_code=204)
def delete_content(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    if not user.is_admin and row.created_by != user.id:
        raise HTTPException(403, "Only the creator or an admin can delete this")
    # Detach learning entries + drop versions so the FKs stay valid.
    for e in db.scalars(select(LearningEntry).where(LearningEntry.content_id == cid)).all():
        e.content_id = None
    for v in db.scalars(select(WorkContentVersion).where(WorkContentVersion.content_id == cid)).all():
        db.delete(v)
    db.delete(row)
    db.commit()


# ── Version history ──────────────────────────────────────────
@router.get("/content/{cid}/versions")
def list_versions(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(WorkContentVersion, User.full_name)
        .outerjoin(User, User.id == WorkContentVersion.edited_by)
        .where(WorkContentVersion.content_id == cid)
        .order_by(WorkContentVersion.id.desc())
    ).all()
    return [
        {
            "id": v.id, "edited_at": v.edited_at.isoformat() if v.edited_at else "",
            "edited_by": name or "", "word_count": _word_count(v.body),
            "preview": (v.body or "")[:280], "body": v.body or "",
        }
        for v, name in rows
    ]


@router.post("/content/{cid}/versions/{vid}/restore")
def restore_version(cid: int, vid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    ver = db.get(WorkContentVersion, vid)
    if not row or not ver or ver.content_id != cid:
        raise HTTPException(404, "Not found")
    # Snapshot current before restoring, so the restore itself is undoable.
    db.add(WorkContentVersion(content_id=row.id, body=row.body or "", edited_by=user.id))
    row.body = ver.body
    db.commit()
    db.refresh(row)
    return _content_out(row, db)


# ── Script analysis (deterministic — no API key needed) ──────
FILLERS = ["um", "uh", "basically", "actually", "literally", "just", "really", "very", "like"]


@router.get("/content/{cid}/analyze")
def analyze_script(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    body = row.body or ""
    words = _word_count(body)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", body) if s.strip()]
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]

    flags: list[dict] = []
    long_s = [s for s in sentences if _word_count(s) > 28]
    if long_s:
        flags.append({
            "kind": "Pacing",
            "detail": f"{len(long_s)} sentence(s) run over 28 words — these read long on camera. Split them so each line lands one idea.",
            "sample": long_s[0][:160],
        })
    long_p = [p for p in paragraphs if _word_count(p) > 120]
    if long_p:
        flags.append({
            "kind": "Structure",
            "detail": f"{len(long_p)} block(s) exceed ~120 words with no break — likely a stretch with no visual change. Plan b-roll or a punch-in here.",
            "sample": long_p[0][:160],
        })
    found_fillers = [f for f in FILLERS if re.search(rf"\b{f}\b", body, re.I)]
    if found_fillers:
        flags.append({
            "kind": "Tighten",
            "detail": "Filler words present: " + ", ".join(found_fillers[:6]) + ". Cutting these raises idea-density per second.",
            "sample": "",
        })

    hook = sentences[0] if sentences else ""
    hook_notes: list[str] = []
    if hook:
        hw = _word_count(hook)
        if hw > 20:
            hook_notes.append(f"The opening line is {hw} words — tighten toward 8–14 so it lands before the scroll.")
        if not re.search(r"\d", hook):
            hook_notes.append("No number or concrete specific in the hook — specifics ('3 years', '£10k') buy credibility.")
        if re.match(r"^(hi|hey|hello|welcome|good morning)", hook.strip(), re.I):
            hook_notes.append("Opens with a greeting — delete it and start on the most surprising line.")
        if not hook_notes:
            hook_notes.append("Opening line looks tight — check it pairs with motion or bold text in the first second.")
    else:
        hook_notes.append("No script body yet — paste the script to analyze the hook.")

    # Beat sheet: one suggested shot per paragraph/sentence group.
    SHOTS = ["Medium — speaker on camera", "B-roll — illustrate the point", "Close-up — detail or reaction",
             "Wide — establish context", "Insert — screen / product / hands", "Punch-in — emphasis"]
    beats = []
    for i, p in enumerate((paragraphs or sentences)[:12]):
        beats.append({
            "n": i + 1,
            "text": p[:180],
            "shot": SHOTS[i % len(SHOTS)],
            "words": _word_count(p),
            "runtime": _runtime(_word_count(p)),
        })

    return {
        "word_count": words,
        "runtime": _runtime(words),
        "sentences": len(sentences),
        "paragraphs": len(paragraphs),
        "avg_sentence_words": round(words / len(sentences), 1) if sentences else 0,
        "flags": flags,
        "hook": {"line": hook[:200], "notes": hook_notes},
        "beats": beats,
        "method": "Deterministic script analysis (word/sentence structure). No AI key required.",
    }


# ── Weekly Learning Log / Shared Learning Library ────────────
class LearningIn(BaseModel):
    entry_date: str = ""
    title: str = Field(min_length=1, max_length=255)
    resource_type: str = Field(default="Video", max_length=40)
    url: str = Field(default="", max_length=600)
    summary: str = ""
    takeaways: str = ""
    workflow_impact: str = ""
    apply_plan: str = ""
    tags: str = Field(default="", max_length=400)
    why_useful: str = ""
    project_target: str = ""
    do_differently: str = ""
    team_adopt: bool = False
    worth_sharing: bool = False
    content_id: int | None = None


def _entry_out(e: LearningEntry, name: str, content_title: str = "") -> dict:
    return {
        "id": e.id, "user_id": e.user_id, "user_name": name,
        "entry_date": e.entry_date, "title": e.title,
        "resource_type": e.resource_type, "url": e.url,
        "summary": e.summary, "takeaways": e.takeaways,
        "workflow_impact": e.workflow_impact, "apply_plan": e.apply_plan,
        "tags": [t.strip() for t in (e.tags or "").split(",") if t.strip()],
        "why_useful": e.why_useful, "project_target": e.project_target,
        "do_differently": e.do_differently, "team_adopt": e.team_adopt,
        "worth_sharing": e.worth_sharing,
        "content_id": e.content_id, "content_title": content_title,
    }


@router.get("/learning")
def list_learning(
    q: str = "", tag: str = "", rtype: str = "", mine: bool = False,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    stmt = select(LearningEntry, User.full_name).join(User, User.id == LearningEntry.user_id)
    if mine:
        stmt = stmt.where(LearningEntry.user_id == user.id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            LearningEntry.title.ilike(like), LearningEntry.summary.ilike(like),
            LearningEntry.takeaways.ilike(like), LearningEntry.tags.ilike(like),
            LearningEntry.workflow_impact.ilike(like), User.full_name.ilike(like),
        ))
    if tag:
        stmt = stmt.where(LearningEntry.tags.ilike(f"%{tag}%"))
    if rtype:
        stmt = stmt.where(LearningEntry.resource_type == rtype)
    stmt = stmt.order_by(LearningEntry.entry_date.desc(), LearningEntry.id.desc()).limit(200)
    rows = db.execute(stmt).all()
    titles = {
        c.id: c.title
        for c in db.scalars(select(WorkContent)).all()
    }
    return [
        _entry_out(e, name or "", titles.get(e.content_id or -1, ""))
        for e, name in rows
    ]


@router.post("/learning", status_code=201)
def add_learning(body: LearningIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = body.model_dump()
    if not data["entry_date"]:
        data["entry_date"] = datetime.now(timezone.utc).date().isoformat()
    if data.get("content_id") and not db.get(WorkContent, data["content_id"]):
        raise HTTPException(400, "Linked content not found")
    row = LearningEntry(**data, user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    title = ""
    if row.content_id:
        c = db.get(WorkContent, row.content_id)
        title = c.title if c else ""
    return _entry_out(row, user.full_name or "", title)


@router.delete("/learning/{eid}", status_code=204)
def delete_learning(eid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(LearningEntry, eid)
    if not row:
        raise HTTPException(404, "Not found")
    if not user.is_admin and row.user_id != user.id:
        raise HTTPException(403, "Only the author or an admin can delete this")
    db.delete(row)
    db.commit()


# ── Learning Progress ────────────────────────────────────────
def _iso_week(d: date) -> str:
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


@router.get("/progress")
def learning_progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    mine = db.scalars(select(LearningEntry).where(LearningEntry.user_id == user.id)).all()
    team_count = len(db.scalars(select(LearningEntry.id)).all())

    tag_counts: dict[str, int] = {}
    types: dict[str, int] = {}
    tools: set[str] = set()
    weeks: set[str] = set()
    for e in mine:
        for t in (e.tags or "").split(","):
            t = t.strip()
            if not t:
                continue
            tag_counts[t] = tag_counts.get(t, 0) + 1
            if t.lower() in TOOL_TAGS:
                tools.add(t)
        types[e.resource_type] = types.get(e.resource_type, 0) + 1
        if e.resource_type.lower() == "tool":
            tools.add(e.title[:40])
        try:
            weeks.add(_iso_week(date.fromisoformat(e.entry_date)))
        except Exception:
            pass

    # Weekly streak: consecutive ISO weeks with ≥1 entry, ending at the
    # current week (or last week, so a Monday visit doesn't read as 0).
    streak = 0
    cursor = date.today()
    if _iso_week(cursor) not in weeks:
        cursor = cursor - timedelta(days=7)
    while _iso_week(cursor) in weeks:
        streak += 1
        cursor = cursor - timedelta(days=7)

    top = sorted(tag_counts.items(), key=lambda kv: -kv[1])[:8]
    return {
        "completed": len(mine),
        "team_total": team_count,
        "weekly_streak": streak,
        "topics_explored": len(tag_counts),
        "tools_learned": sorted(tools),
        "top_subjects": [{"tag": t, "count": c} for t, c in top],
        "types": [{"type": t, "count": c} for t, c in sorted(types.items(), key=lambda kv: -kv[1])],
    }


# (Weekly learning recommendations live in the Industry Monitoring section.)
