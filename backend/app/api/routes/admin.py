"""Admin-only endpoints: user oversight + Creative Intelligence.

Access is restricted to settings.ADMIN_EMAIL (simongodlisten10@gmail.com).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import hash_password
from app.models import ActivityLog, User
from app.schemas.schemas import SignupRequest
from app.services import ai_service

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Admin access required")
    return user


@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(get_admin)):
    users = db.scalars(select(User).order_by(User.created_at)).all()
    out = []
    for u in users:
        logins = db.scalar(
            select(func.count()).select_from(ActivityLog).where(
                ActivityLog.user_id == u.id, ActivityLog.kind == "login"
            )
        ) or 0
        last = db.scalar(
            select(ActivityLog.created_at).where(ActivityLog.user_id == u.id)
            .order_by(ActivityLog.created_at.desc()).limit(1)
        )
        actions = db.scalar(
            select(func.count()).select_from(ActivityLog).where(ActivityLog.user_id == u.id)
        ) or 0
        out.append({
            "id": u.id, "email": u.email, "full_name": u.full_name,
            "xp": u.xp, "level": u.level, "streak_days": u.streak_days,
            "is_admin": u.is_admin, "created_at": u.created_at,
            "logins": logins, "actions": actions, "last_active": last,
        })
    return out


@router.get("/activity")
def recent_activity(
    limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_admin)
):
    rows = db.execute(
        select(ActivityLog, User.email, User.full_name)
        .join(User, ActivityLog.user_id == User.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(min(limit, 300))
    ).all()
    return [
        {
            "email": email, "full_name": full_name,
            "kind": log.kind, "description": log.description,
            "xp": log.xp, "created_at": log.created_at,
        }
        for log, email, full_name in rows
    ]


@router.post("/users", status_code=201)
def create_user(
    body: SignupRequest, db: Session = Depends(get_db), admin: User = Depends(get_admin)
):
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(409, "Email already registered")
    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name or body.email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


# Curated "command center" of where to watch for trends (always available).
CURATED_SOURCES = {
    "X (real-time AI news)": {
        "people": ["Sam Altman", "Demis Hassabis", "Andrej Karpathy", "Linus Ekenstam"],
        "companies": ["OpenAI", "Google Gemini", "Anthropic", "Runway", "ElevenLabs", "Midjourney"],
    },
    "YouTube": {
        "AI": ["Matt Wolfe", "The AI Grid", "Futurepedia"],
        "Editing": ["Daniel Schiffer", "Hillier Smith", "Finzar"],
        "Storytelling": ["Patrick Bet-David", "Alex Hormozi", "Ali Abdaal"],
    },
    "Reddit": {
        "subreddits": ["r/ChatGPT", "r/OpenAI", "r/ArtificialIntelligence",
                       "r/videoediting", "r/AfterEffects", "r/premiere", "r/Filmmakers"],
    },
    "Newsletters": {
        "subscribe": ["Ben's Bites", "The Rundown AI", "Superhuman AI", "Futurepedia"],
    },
    "Product Hunt": {"daily": ["AI tools", "Editing tools", "Productivity software"]},
}

INTEL_SECTIONS = {
    "AI Updates": ["ChatGPT", "Gemini", "Claude", "Midjourney", "Runway", "ElevenLabs", "Premiere Pro", "Frame.io", "HeyGen", "Storyblocks"],
    "Social Trends": ["TikTok trends", "Instagram trends", "X trends", "YouTube trends"],
    "Editing Trends": ["Subtitle styles", "Motion graphics", "Hooks", "Color grading", "Sound effects"],
    "Creator Trends": ["Alex Hormozi", "Patrick Bet-David", "Vusi Thembekwayo", "Ali Abdaal"],
}


@router.get("/intel")
def creative_intel(admin: User = Depends(get_admin)):
    digest = ai_service.creative_intel_digest()
    return {
        "digest": digest,            # live items (Gemini+Search) or unavailable
        "sections": INTEL_SECTIONS,  # dashboard groupings
        "sources": CURATED_SOURCES,  # curated where-to-look hub
    }
