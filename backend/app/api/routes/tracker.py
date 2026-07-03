"""Tracker Analytics — daily work log attributed to each editor.

Editors create entries (auto-attributed) and can view the team's output.
Once saved, only an admin can edit an entry.
"""
from collections import Counter
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import TrackerEntry, User
from app.schemas.schemas import (
    EditorOut,
    TrackerEntryCreate,
    TrackerEntryOut,
    TrackerEntryUpdate,
    TrackerStatByEditor,
    TrackerStatByPeriod,
    TrackerStats,
)

router = APIRouter(prefix="/tracker", tags=["tracker"])


def _name(u: User | None) -> str:
    if not u:
        return "Unknown"
    return u.full_name or u.email.split("@")[0]


def _filtered(
    db: Session, editor_id: int | None, month: str | None,
    date_from: date | None, date_to: date | None,
):
    stmt = select(TrackerEntry)
    if editor_id:
        stmt = stmt.where(TrackerEntry.user_id == editor_id)
    if date_from:
        stmt = stmt.where(TrackerEntry.entry_date >= date_from)
    if date_to:
        stmt = stmt.where(TrackerEntry.entry_date <= date_to)
    rows = db.scalars(stmt.order_by(TrackerEntry.entry_date.desc(), TrackerEntry.id.desc())).all()
    if month:  # "YYYY-MM" — filter in Python for cross-DB simplicity
        rows = [r for r in rows if r.entry_date.strftime("%Y-%m") == month]
    return rows


@router.post("", response_model=TrackerEntryOut, status_code=201)
def create_entry(
    body: TrackerEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    entry = TrackerEntry(user_id=user.id, **body.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    out = TrackerEntryOut.model_validate(entry)
    out.editor_name = _name(user)
    return out


@router.get("/editors", response_model=list[EditorOut])
def list_editors(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Editors who have logged at least one entry.
    ids = db.scalars(select(TrackerEntry.user_id).distinct()).all()
    users = db.scalars(select(User).where(User.id.in_(ids))).all() if ids else []
    editors = [EditorOut(id=u.id, name=_name(u)) for u in users]
    # Always include the current user so they can file their first entry.
    if user.id not in {e.id for e in editors}:
        editors.append(EditorOut(id=user.id, name=_name(user)))
    return sorted(editors, key=lambda e: e.name.lower())


@router.get("", response_model=list[TrackerEntryOut])
def list_entries(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    editor_id: int | None = Query(default=None),
    month: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
):
    rows = _filtered(db, editor_id, month, date_from, date_to)
    names = {u.id: _name(u) for u in db.scalars(select(User)).all()}
    out = []
    for r in rows:
        o = TrackerEntryOut.model_validate(r)
        o.editor_name = names.get(r.user_id, "Unknown")
        out.append(o)
    return out


@router.get("/stats", response_model=TrackerStats)
def stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    editor_id: int | None = Query(default=None),
    month: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    group_by: str = Query(default="month"),  # month | day
):
    rows = _filtered(db, editor_id, month, date_from, date_to)
    names = {u.id: _name(u) for u in db.scalars(select(User)).all()}
    # A "clip" = an entry that recorded a clip name.
    clip_rows = [r for r in rows if (r.clip_name or "").strip()]

    by_editor_counter: Counter = Counter()
    for r in clip_rows:
        by_editor_counter[names.get(r.user_id, "Unknown")] += 1

    fmt = "%Y-%m-%d" if group_by == "day" else "%Y-%m"
    by_period_counter: Counter = Counter()
    for r in clip_rows:
        by_period_counter[r.entry_date.strftime(fmt)] += 1

    return TrackerStats(
        total_entries=len(rows),
        total_clips=len(clip_rows),
        distinct_editors=len({r.user_id for r in rows}),
        by_editor=[TrackerStatByEditor(editor_name=k, clips=v)
                   for k, v in sorted(by_editor_counter.items(), key=lambda x: -x[1])],
        by_period=[TrackerStatByPeriod(period=k, clips=v)
                   for k, v in sorted(by_period_counter.items())],
    )


@router.patch("/{entry_id}", response_model=TrackerEntryOut)
def update_entry(
    entry_id: int,
    body: TrackerEntryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Rule: once saved, only an admin may edit/correct an entry.
    if not user.is_admin:
        raise HTTPException(403, "Entries can only be edited by an admin once saved.")
    entry = db.get(TrackerEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    out = TrackerEntryOut.model_validate(entry)
    out.editor_name = _name(db.get(User, entry.user_id))
    return out
