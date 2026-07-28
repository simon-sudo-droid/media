"""Content Workspace — real work content, learning log/library, progress,
and weekly learning recommendations."""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete as sa_delete, or_, select, update as sa_update
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import (
    LearningEntry, Notification, User, WorkContent, WorkContentActivity,
    WorkContentComment, WorkContentVersion,
)
from app.services import script_analysis as sa

router = APIRouter(prefix="/workspace", tags=["workspace"])

# Talking-head narration pace — used for the runtime estimate on scripts.
WORDS_PER_MINUTE = 150
# A soft edit lock older than this is treated as abandoned.
LOCK_TTL = timedelta(minutes=3)


# ── Activity + notification helpers ──────────────────────────
def _log(db: Session, cid: int, user: User, action: str, detail: str = "") -> None:
    db.add(WorkContentActivity(content_id=cid, user_id=user.id, action=action, detail=detail))


def _notify(db: Session, user_ids: list[int], kind: str, title: str,
            body: str = "", content_id: int | None = None, exclude: int | None = None) -> None:
    for uid in {u for u in user_ids if u and u != exclude}:
        db.add(Notification(user_id=uid, kind=kind, title=title, body=body, content_id=content_id))


def _interested_users(db: Session, c: WorkContent) -> list[int]:
    """Everyone who should hear about a change: creator, assigned owner,
    admins, and anyone who has commented on it."""
    ids: list[int] = []
    if c.created_by:
        ids.append(c.created_by)
    if c.owner:
        u = db.scalar(select(User).where(User.full_name == c.owner))
        if u:
            ids.append(u.id)
    ids += [r for r in db.scalars(
        select(WorkContentComment.user_id).where(WorkContentComment.content_id == c.id)
    ).all()]
    for u in db.scalars(select(User)).all():
        if u.is_admin:
            ids.append(u.id)
    return ids

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
    read = sa.readability(
        c.body or "", words,
        max(1, len([s for s in re.split(r"(?<=[.!?])\s+", c.body or "") if s.strip()])),
    )
    out = {
        "id": c.id, "category": c.category, "title": c.title,
        "content_type": c.content_type, "platform": c.platform, "body": c.body,
        "status": c.status, "notes": c.notes,
        "links": [_doc_name(l) for l in (c.links or "").splitlines() if l.strip()],
        "owner": c.owner or "", "due_date": c.due_date or "",
        "word_count": words, "runtime": _runtime(words),
        "readability": read["score"], "readability_label": read["label"],
        # Completion % across the pipeline stages.
        "completion": round(STATUSES.index(c.status) / (len(STATUSES) - 1) * 100)
        if c.status in STATUSES else 0,
        "updated_at": c.updated_at.isoformat() if c.updated_at else "",
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }
    # Soft edit lock — only report it while the heartbeat is fresh.
    out["editing_by"] = ""
    if c.editing_by and c.editing_at:
        at = c.editing_at if c.editing_at.tzinfo else c.editing_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - at < LOCK_TTL:
            if db is not None:
                u = db.get(User, c.editing_by)
                out["editing_by"] = (u.full_name or u.email) if u else ""
            out["editing_by_id"] = c.editing_by
    if db is not None:
        out["version_count"] = len(db.scalars(
            select(WorkContentVersion.id).where(WorkContentVersion.content_id == c.id)
        ).all())
        out["comment_count"] = len(db.scalars(
            select(WorkContentComment.id)
            .where(WorkContentComment.content_id == c.id, WorkContentComment.resolved == False)  # noqa: E712
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
    data = body.model_dump()
    # Only admins assign ownership (accountability stays with the admin).
    if data.get("owner") and not user.is_admin:
        data["owner"] = ""
    row = WorkContent(**data, created_by=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    _log(db, row.id, user, "created", f"Uploaded “{row.title}”")
    db.commit()
    return _content_out(row, db)


@router.patch("/content/{cid}")
def update_content(cid: int, body: ContentPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    data = body.model_dump(exclude_none=True)
    if "owner" in data and not user.is_admin:
        raise HTTPException(403, "Only an admin can assign the owner")

    watchers = _interested_users(db, row)
    who = user.full_name or user.email

    # Snapshot the previous script before overwriting it, so a bad edit is
    # always recoverable from version history.
    if "body" in data and data["body"] != row.body:
        db.add(WorkContentVersion(content_id=row.id, body=row.body or "", edited_by=user.id))
        _log(db, row.id, user, "edited",
             f"Script edited ({_word_count(row.body)} → {_word_count(data['body'])} words)")
        _notify(db, watchers, "edit", f"Script edited: {row.title}",
                f"{who} edited the script.", row.id, exclude=user.id)
    if "status" in data and data["status"] != row.status:
        _log(db, row.id, user, "status", f"{row.status} → {data['status']}")
        _notify(db, watchers, "status", f"{row.title} → {data['status']}",
                f"{who} moved it from {row.status}.", row.id, exclude=user.id)
    if "owner" in data and data["owner"] != row.owner:
        _log(db, row.id, user, "owner", f"Assigned to {data['owner'] or 'nobody'}")
        target = db.scalar(select(User).where(User.full_name == data["owner"])) if data["owner"] else None
        if target:
            _notify(db, [target.id], "assign", f"You were assigned: {row.title}",
                    f"{who} assigned this script to you.", row.id, exclude=user.id)

    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _content_out(row, db)


# ── Team / ownership ─────────────────────────────────────────
@router.get("/editors")
def list_editors(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Assignable editors for the Owner dropdown.

    Admins are excluded — they assign work rather than being assigned it, so
    the list stays the actual editing team.
    """
    rows = db.scalars(select(User).order_by(User.full_name)).all()
    return [
        {"id": u.id, "name": u.full_name or u.email, "email": u.email, "is_admin": u.is_admin}
        for u in rows
        if not u.is_admin
    ]


@router.get("/team")
def list_team(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Everyone with an account — used for @mention suggestions in comments
    (you can mention an admin even though they aren't assignable)."""
    rows = db.scalars(select(User).order_by(User.full_name)).all()
    return [
        {"id": u.id, "name": u.full_name or u.email, "email": u.email, "is_admin": u.is_admin}
        for u in rows
    ]


# ── Soft edit lock (collaboration indicator) ─────────────────
@router.post("/content/{cid}/editing")
def heartbeat_editing(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    holder = ""
    if row.editing_by and row.editing_by != user.id and row.editing_at:
        at = row.editing_at if row.editing_at.tzinfo else row.editing_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - at < LOCK_TTL:
            u = db.get(User, row.editing_by)
            holder = (u.full_name or u.email) if u else "another editor"
            return {"locked": True, "by": holder}
    row.editing_by = user.id
    row.editing_at = datetime.now(timezone.utc)
    db.commit()
    return {"locked": False, "by": ""}


@router.delete("/content/{cid}/editing", status_code=204)
def release_editing(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if row and row.editing_by == user.id:
        row.editing_by = None
        row.editing_at = None
        db.commit()


# ── Activity timeline ────────────────────────────────────────
@router.get("/content/{cid}/activity")
def content_activity(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(WorkContentActivity, User.full_name)
        .outerjoin(User, User.id == WorkContentActivity.user_id)
        .where(WorkContentActivity.content_id == cid)
        .order_by(WorkContentActivity.id.desc())
        .limit(60)
    ).all()
    return [
        {"id": a.id, "action": a.action, "detail": a.detail,
         "user": name or "", "at": a.created_at.isoformat() if a.created_at else ""}
        for a, name in rows
    ]


# ── Threaded comments with @mentions ─────────────────────────
class CommentIn(BaseModel):
    body: str = Field(min_length=1)
    parent_id: int | None = None


@router.get("/content/{cid}/comments")
def list_comments(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(WorkContentComment, User.full_name)
        .join(User, User.id == WorkContentComment.user_id)
        .where(WorkContentComment.content_id == cid)
        .order_by(WorkContentComment.id)
    ).all()
    return [
        {"id": c.id, "body": c.body, "user": name or "", "user_id": c.user_id,
         "parent_id": c.parent_id, "resolved": c.resolved,
         "at": c.created_at.isoformat() if c.created_at else ""}
        for c, name in rows
    ]


@router.post("/content/{cid}/comments", status_code=201)
def add_comment(cid: int, body: CommentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    c = WorkContentComment(content_id=cid, user_id=user.id, parent_id=body.parent_id, body=body.body.strip())
    db.add(c)
    who = user.full_name or user.email
    _log(db, cid, user, "comment", body.body.strip()[:120])

    # @mentions → direct notification; everyone else watching gets the thread
    # update. Only trailing *capitalised* words join the name, so
    # "@Gift Richard please fix" captures "Gift Richard", not the sentence.
    names = [n.strip() for n in re.findall(r"@([A-Za-z][\w'-]*(?:\s+[A-Z][\w'-]*)*)", body.body)]
    mentioned: list[int] = []
    if names:
        for u in db.scalars(select(User)).all():
            label = (u.full_name or u.email).lower()
            first = label.split()[0] if label else ""
            for n in names:
                nl = n.lower()
                if nl and (label.startswith(nl) or nl.startswith(label) or nl.split()[0] == first):
                    mentioned.append(u.id)
                    break
    if mentioned:
        _notify(db, mentioned, "mention", f"{who} mentioned you on {row.title}",
                body.body.strip()[:180], cid, exclude=user.id)
    _notify(db, [i for i in _interested_users(db, row) if i not in mentioned],
            "comment", f"New comment on {row.title}", f"{who}: {body.body.strip()[:160]}", cid, exclude=user.id)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "body": c.body, "user": who, "user_id": user.id,
            "parent_id": c.parent_id, "resolved": False,
            "at": c.created_at.isoformat() if c.created_at else ""}


@router.patch("/comments/{comment_id}")
def resolve_comment(comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.get(WorkContentComment, comment_id)
    if not c:
        raise HTTPException(404, "Not found")
    c.resolved = not c.resolved
    db.commit()
    return {"id": c.id, "resolved": c.resolved}


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.get(WorkContentComment, comment_id)
    if not c:
        raise HTTPException(404, "Not found")
    if not user.is_admin and c.user_id != user.id:
        raise HTTPException(403, "Only the author or an admin can delete this")
    db.execute(sa_delete(WorkContentComment).where(WorkContentComment.parent_id == comment_id))
    db.flush()
    db.delete(c)
    db.commit()


@router.delete("/content/{cid}", status_code=204)
def delete_content(cid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    if not user.is_admin and row.created_by != user.id:
        raise HTTPException(403, "Only the creator or an admin can delete this")
    # Detach learning entries and drop versions FIRST, flushing so the child
    # rows are gone before the parent delete (otherwise SQLAlchemy may order
    # the parent DELETE first and Postgres rejects it on the FK).
    db.execute(
        sa_update(LearningEntry).where(LearningEntry.content_id == cid).values(content_id=None)
    )
    db.execute(sa_delete(WorkContentVersion).where(WorkContentVersion.content_id == cid))
    # Replies first (self-referencing FK), then top-level comments.
    db.execute(sa_delete(WorkContentComment).where(
        WorkContentComment.content_id == cid, WorkContentComment.parent_id.isnot(None)
    ))
    db.execute(sa_delete(WorkContentComment).where(WorkContentComment.content_id == cid))
    db.execute(sa_delete(WorkContentActivity).where(WorkContentActivity.content_id == cid))
    db.flush()
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


# ── Script analysis + selection actions ──────────────────────
@router.get("/content/{cid}/analyze")
def analyze_script(
    cid: int, target: int | None = None,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    result = sa.analyze(row.body or "", row.platform or "", row.content_type or "", target)
    _log(db, cid, user, "ai", "Ran script analysis")
    db.commit()
    return result


class SelectionIn(BaseModel):
    text: str = Field(min_length=1)
    ratio: float = 0.3


@router.post("/content/{cid}/tighten")
def tighten_selection(cid: int, body: SelectionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(WorkContent, cid):
        raise HTTPException(404, "Not found")
    out = sa.tighten(body.text, max(0.05, min(0.8, body.ratio)))
    _log(db, cid, user, "ai", f"Tightened a selection ({out['saved_pct']}% shorter)")
    db.commit()
    return out


@router.post("/content/{cid}/broll")
def broll_selection(cid: int, body: SelectionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(WorkContent, cid):
        raise HTTPException(404, "Not found")
    out = sa.broll_for(body.text)
    _log(db, cid, user, "ai", "Generated b-roll ideas for a selection")
    db.commit()
    return out


@router.post("/content/{cid}/inspect")
def inspect_selection(cid: int, body: SelectionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Analyze just the highlighted passage (readability, repetition, hook)."""
    row = db.get(WorkContent, cid)
    if not row:
        raise HTTPException(404, "Not found")
    return sa.analyze(body.text, row.platform or "", row.content_type or "", 0)



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
