"""Video-editing glossary — searchable, additive (newest first)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import GlossaryTerm, User
from app.schemas.schemas import GlossaryTermCreate, GlossaryTermOut

router = APIRouter(prefix="/glossary", tags=["glossary"])


@router.get("", response_model=list[GlossaryTermOut])
def list_terms(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(GlossaryTerm).order_by(GlossaryTerm.created_at.desc(), GlossaryTerm.id.desc())
    ).all()


@router.post("", response_model=GlossaryTermOut, status_code=201)
def add_term(
    body: GlossaryTermCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    term = GlossaryTerm(term=body.term.strip(), definition=body.definition.strip(), created_by=user.id)
    db.add(term)
    db.commit()
    db.refresh(term)
    return term
