"""Industry Monitoring — daily AI video-editing digest endpoints.

The digest is generated lazily: the first request of a new day fetches the
monitored feeds and persists the report; everyone else reads the cached row.
Admins can force a same-day refresh.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import IndustryDigest, User
from app.services.industry import build_digest

router = APIRouter(prefix="/industry", tags=["industry"])


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


@router.get("/today")
def today_digest(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = _today()
    row = db.scalar(select(IndustryDigest).where(IndustryDigest.digest_date == today))
    if row:
        return json.loads(row.payload)
    # First visitor of the day generates it (feeds are fetched best-effort
    # with short timeouts, so this stays within a normal request budget).
    return build_digest(db, today)


@router.get("/history")
def digest_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(IndustryDigest).order_by(IndustryDigest.digest_date.desc()).limit(14)
    ).all()
    return [{"date": r.digest_date, "created_at": r.created_at.isoformat()} for r in rows]


@router.get("/digest/{date}")
def digest_by_date(date: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.scalar(select(IndustryDigest).where(IndustryDigest.digest_date == date))
    if not row:
        raise HTTPException(status_code=404, detail="No digest for that date")
    return json.loads(row.payload)


@router.post("/refresh")
def refresh_digest(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return build_digest(db, _today())


@router.get("/cron")
def cron_generate(db: Session = Depends(get_db)):
    """Unauthenticated, idempotent daily trigger (hit by the keep-alive job).

    Only generates when today's digest doesn't exist yet, so hammering it is
    harmless and it leaks no digest content.
    """
    today = _today()
    row = db.scalar(select(IndustryDigest).where(IndustryDigest.digest_date == today))
    if row:
        return {"ok": True, "generated": False, "date": today}
    build_digest(db, today)
    return {"ok": True, "generated": True, "date": today}
