from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.schemas import (
    BrollResponse,
    ScriptRequest,
    SlideAnalysisRequest,
    SlideAnalysisResponse,
    StorytellingResponse,
)
from app.services import ai_service
from app.services.gamification import award_xp

router = APIRouter(prefix="/ai", tags=["ai"])

AI_USE_XP = 10


def _log_use(db: Session, user: User, label: str) -> None:
    award_xp(db, user, AI_USE_XP, "ai", label)
    db.commit()


@router.post("/broll", response_model=BrollResponse)
def script_to_broll(
    body: ScriptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = ai_service.generate_broll(body.script)
    _log_use(db, user, "Used AI Script-to-B-roll generator")
    return result


@router.post("/storytelling", response_model=StorytellingResponse)
def storytelling_coach(
    body: ScriptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = ai_service.analyze_storytelling(body.script)
    _log_use(db, user, "Used Storytelling Coach")
    return result


@router.post("/slides", response_model=SlideAnalysisResponse)
def slide_analyzer(
    body: SlideAnalysisRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.notes.strip() and not body.image_base64:
        raise HTTPException(422, "Provide a slide description or upload an image.")
    result = ai_service.analyze_slides(body.notes, body.image_base64)
    _log_use(db, user, "Used Slide Analyzer")
    return result
