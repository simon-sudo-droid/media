"""Content Workspace — real work content, learning log/library, progress,
and weekly learning recommendations."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import LearningEntry, User, WorkContent

router = APIRouter(prefix="/workspace", tags=["workspace"])

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


class ContentPatch(BaseModel):
    title: str | None = None
    content_type: str | None = None
    platform: str | None = None
    body: str | None = None
    status: str | None = None
    notes: str | None = None
    links: str | None = None


def _content_out(c: WorkContent) -> dict:
    return {
        "id": c.id, "category": c.category, "title": c.title,
        "content_type": c.content_type, "platform": c.platform, "body": c.body,
        "status": c.status, "notes": c.notes,
        "links": [l.strip() for l in (c.links or "").splitlines() if l.strip()],
        "updated_at": c.updated_at.isoformat() if c.updated_at else "",
    }


@router.get("/content")
def list_content(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(WorkContent).order_by(WorkContent.updated_at.desc())).all()
    return [_content_out(c) for c in rows]


@router.post("/content", status_code=201)
def add_content(body: ContentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.category not in ("leadership", "case_study"):
        raise HTTPException(400, "category must be leadership or case_study")
    row = WorkContent(**body.model_dump(), created_by=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _content_out(row)


@router.patch("/content/{cid}")
def update_content(cid: int, body: ContentPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _content_out(row)


@router.delete("/content/{cid}", status_code=204)
def delete_content(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    if not user.is_admin and row.created_by != user.id:
        raise HTTPException(403, "Only the creator or an admin can delete this")
    db.delete(row)
    db.commit()


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


def _entry_out(e: LearningEntry, name: str) -> dict:
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
    return [_entry_out(e, name or "") for e, name in db.execute(stmt).all()]


@router.post("/learning", status_code=201)
def add_learning(body: LearningIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = body.model_dump()
    if not data["entry_date"]:
        data["entry_date"] = datetime.now(timezone.utc).date().isoformat()
    row = LearningEntry(**data, user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _entry_out(row, user.full_name or "")


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
