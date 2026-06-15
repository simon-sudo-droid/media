"""Editing workflow checklists with per-user progress."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Checklist, ChecklistItem, ChecklistItemCompletion, User
from app.schemas.schemas import (
    ChecklistDetailOut,
    ChecklistItemOut,
    ChecklistOut,
)

router = APIRouter(tags=["checklists"])


def _completed_item_ids(db: Session, user_id: int) -> set[int]:
    rows = db.scalars(
        select(ChecklistItemCompletion.item_id).where(
            ChecklistItemCompletion.user_id == user_id
        )
    ).all()
    return set(rows)


@router.get("/checklists", response_model=list[ChecklistOut])
def list_checklists(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    checklists = db.scalars(select(Checklist).order_by(Checklist.order_index)).all()
    done = _completed_item_ids(db, user.id)
    out = []
    for c in checklists:
        item_ids = {it.id for it in c.items}
        out.append(
            ChecklistOut(
                id=c.id, slug=c.slug, title=c.title, description=c.description,
                category=c.category, icon=c.icon,
                item_count=len(item_ids), completed_count=len(item_ids & done),
            )
        )
    return out


@router.get("/checklists/{slug}", response_model=ChecklistDetailOut)
def get_checklist(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.scalar(select(Checklist).where(Checklist.slug == slug))
    if not c:
        raise HTTPException(404, "Checklist not found")
    done = _completed_item_ids(db, user.id)
    items = [
        ChecklistItemOut(id=it.id, text=it.text, order_index=it.order_index, completed=it.id in done)
        for it in c.items
    ]
    item_ids = {it.id for it in c.items}
    return ChecklistDetailOut(
        id=c.id, slug=c.slug, title=c.title, description=c.description,
        category=c.category, icon=c.icon,
        item_count=len(item_ids), completed_count=len(item_ids & done), items=items,
    )


@router.post("/checklist-items/{item_id}/toggle")
def toggle_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(ChecklistItem, item_id)
    if not item:
        raise HTTPException(404, "Checklist item not found")
    existing = db.scalar(
        select(ChecklistItemCompletion).where(
            ChecklistItemCompletion.user_id == user.id,
            ChecklistItemCompletion.item_id == item_id,
        )
    )
    if existing:
        db.delete(existing)
        completed = False
    else:
        db.add(ChecklistItemCompletion(user_id=user.id, item_id=item_id))
        completed = True
    db.commit()
    return {"item_id": item_id, "completed": completed}


@router.post("/checklists/{slug}/reset")
def reset_checklist(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.scalar(select(Checklist).where(Checklist.slug == slug))
    if not c:
        raise HTTPException(404, "Checklist not found")
    item_ids = [it.id for it in c.items]
    if item_ids:
        for comp in db.scalars(
            select(ChecklistItemCompletion).where(
                ChecklistItemCompletion.user_id == user.id,
                ChecklistItemCompletion.item_id.in_(item_ids),
            )
        ).all():
            db.delete(comp)
        db.commit()
    return {"reset": True}
