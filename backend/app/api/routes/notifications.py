"""Per-user notifications: status changes, comments, @mentions, edits."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select, update as sa_update
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Notification, User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.id.desc())
        .limit(50)
    ).all()
    return {
        "unread": sum(1 for n in rows if not n.read),
        "items": [
            {"id": n.id, "kind": n.kind, "title": n.title, "body": n.body,
             "content_id": n.content_id, "read": n.read,
             "at": n.created_at.isoformat() if n.created_at else ""}
            for n in rows
        ],
    }


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.execute(
        sa_update(Notification)
        .where(Notification.user_id == user.id, Notification.read == False)  # noqa: E712
        .values(read=True)
    )
    db.commit()
    return {"ok": True}
