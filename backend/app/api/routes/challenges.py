from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Challenge, ChallengeCompletion, User
from app.schemas.schemas import ChallengeOut, ChallengeSubmission
from app.services.gamification import award_xp

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _completed_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(
            select(ChallengeCompletion.challenge_id).where(
                ChallengeCompletion.user_id == user_id
            )
        ).all()
    )


def safe_payload(payload: dict) -> dict:
    """Strip the answer key / explanation so they never reach the client."""
    return {k: v for k, v in payload.items() if k not in ("correct_index", "explanation")}


@router.get("", response_model=list[ChallengeOut])
def list_challenges(
    kind: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Challenge).order_by(Challenge.id)
    if kind:
        stmt = stmt.where(Challenge.kind == kind)
    challenges = db.scalars(stmt).all()
    done = _completed_ids(db, user.id)
    return [
        ChallengeOut(
            id=c.id, slug=c.slug, title=c.title, description=c.description,
            level=c.level, kind=c.kind, xp_reward=c.xp_reward,
            payload=safe_payload(c.payload), completed=c.id in done,
        )
        for c in challenges
    ]


@router.get("/daily", response_model=ChallengeOut)
def daily_challenge(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    challenge = _pick_daily(db)
    if not challenge:
        raise HTTPException(404, "No challenges available")
    done = _completed_ids(db, user.id)
    return ChallengeOut(
        id=challenge.id, slug=challenge.slug, title=challenge.title,
        description=challenge.description, level=challenge.level, kind=challenge.kind,
        xp_reward=challenge.xp_reward, payload=safe_payload(challenge.payload),
        completed=challenge.id in done,
    )


def _pick_daily(db: Session) -> Challenge | None:
    """Deterministically rotate a daily challenge by day-of-year."""
    challenges = db.scalars(
        select(Challenge).where(Challenge.kind == "daily").order_by(Challenge.id)
    ).all()
    if not challenges:
        challenges = db.scalars(select(Challenge).order_by(Challenge.id)).all()
    if not challenges:
        return None
    idx = date.today().timetuple().tm_yday % len(challenges)
    return challenges[idx]


@router.post("/{challenge_id}/submit")
def submit_challenge(
    challenge_id: int,
    body: ChallengeSubmission,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    challenge = db.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(404, "Challenge not found")

    correct_index = challenge.payload.get("correct_index", 0)
    is_correct = body.answer == correct_index
    explanation = challenge.payload.get("explanation", "")

    already = db.scalar(
        select(ChallengeCompletion).where(
            ChallengeCompletion.user_id == user.id,
            ChallengeCompletion.challenge_id == challenge_id,
        )
    )
    xp_earned = 0
    if is_correct and not already:
        xp_earned = challenge.xp_reward
        db.add(ChallengeCompletion(user_id=user.id, challenge_id=challenge_id, xp_earned=xp_earned))
        award_xp(db, user, xp_earned, "challenge", f"Completed challenge: {challenge.title}")
        db.commit()
        db.refresh(user)

    return {
        "correct": is_correct,
        "correct_index": correct_index,
        "explanation": explanation,
        "xp_earned": xp_earned,
        "total_xp": user.xp,
    }
