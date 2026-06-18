from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.schemas import (
    BrollResponse,
    BrollVideoJob,
    BrollVideoRequest,
    HookResponse,
    ScriptRequest,
    SeniorReviewRequest,
    SeniorReviewResponse,
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


@router.post("/broll/video", response_model=BrollVideoJob)
def broll_video_start(
    body: BrollVideoRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Starts a Veo clip job (or returns an instant storyboard fallback). No XP:
    # a sample clip is a repeatable sub-action of /broll, so awarding per call
    # would let it be farmed.
    return ai_service.start_broll_video(body.prompt, body.label, body.aspect_ratio)


@router.get("/broll/video/{job_id}", response_model=BrollVideoJob)
def broll_video_status(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return ai_service.poll_broll_video(job_id)


@router.post("/hook", response_model=HookResponse)
def hook_analyser(
    body: ScriptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = ai_service.analyze_hook(body.script)
    _log_use(db, user, "Used Hook Analyser")
    return result


@router.post("/senior-review", response_model=SeniorReviewResponse)
def senior_review(
    body: SeniorReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not (body.script.strip() or body.transcript.strip() or body.premiere_xml.strip() or body.video_base64):
        raise HTTPException(422, "Provide at least a script, transcript, Premiere XML, or video.")
    result = ai_service.senior_review(body.script, body.transcript, body.premiere_xml, body.video_base64)
    _log_use(db, user, "Used Senior Editor review")
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
