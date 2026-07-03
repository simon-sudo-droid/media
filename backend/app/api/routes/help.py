"""Guide & Help — FAQ, changelog, and Q&A (admin answers + promotes to FAQ)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import ChangelogEntry, FaqEntry, HelpQuestion, User
from app.schemas.schemas import (
    ChangelogOut,
    FaqOut,
    HelpAnswerRequest,
    HelpQuestionCreate,
    HelpQuestionOut,
)

router = APIRouter(prefix="/help", tags=["help"])


def _name(u: User | None) -> str:
    if not u:
        return "Unknown"
    return u.full_name or u.email.split("@")[0]


@router.get("/faq", response_model=list[FaqOut])
def faq(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(FaqEntry).order_by(FaqEntry.order_index, FaqEntry.id)).all()


@router.get("/changelog", response_model=list[ChangelogOut])
def changelog(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(ChangelogEntry).order_by(ChangelogEntry.order_index.desc(), ChangelogEntry.id.desc())
    ).all()


@router.get("/questions", response_model=list[HelpQuestionOut])
def list_questions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(HelpQuestion)
    if not user.is_admin:
        stmt = stmt.where(HelpQuestion.user_id == user.id)
    rows = db.scalars(stmt.order_by(HelpQuestion.created_at.desc(), HelpQuestion.id.desc())).all()
    names = {u.id: _name(u) for u in db.scalars(select(User)).all()}
    out = []
    for r in rows:
        o = HelpQuestionOut.model_validate(r)
        o.asker_name = names.get(r.user_id, "Unknown")
        out.append(o)
    return out


@router.post("/questions", response_model=HelpQuestionOut, status_code=201)
def ask(
    body: HelpQuestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = HelpQuestion(user_id=user.id, question=body.question.strip())
    db.add(q)
    db.commit()
    db.refresh(q)
    o = HelpQuestionOut.model_validate(q)
    o.asker_name = _name(user)
    return o


@router.patch("/questions/{qid}/answer", response_model=HelpQuestionOut)
def answer(
    qid: int,
    body: HelpAnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.is_admin:
        raise HTTPException(403, "Only an admin can answer questions.")
    q = db.get(HelpQuestion, qid)
    if not q:
        raise HTTPException(404, "Question not found")
    q.answer = body.answer.strip()
    q.answered = True
    q.answered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(q)
    o = HelpQuestionOut.model_validate(q)
    o.asker_name = _name(db.get(User, q.user_id))
    return o


@router.post("/questions/{qid}/promote", response_model=FaqOut, status_code=201)
def promote(
    qid: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.is_admin:
        raise HTTPException(403, "Only an admin can promote answers to the FAQ.")
    q = db.get(HelpQuestion, qid)
    if not q or not q.answered:
        raise HTTPException(400, "Question must be answered before promoting.")
    faq_entry = FaqEntry(question=q.question, answer=q.answer, order_index=0)
    db.add(faq_entry)
    q.promoted = True
    db.commit()
    db.refresh(faq_entry)
    return faq_entry
