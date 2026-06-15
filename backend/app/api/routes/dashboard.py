from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import (
    ActivityLog,
    Challenge,
    ChallengeCompletion,
    Course,
    Lesson,
    LessonCompletion,
    QuizAttempt,
    User,
)
from app.schemas.schemas import (
    ActivityOut,
    ChallengeOut,
    DashboardOut,
    LeaderboardEntry,
    UserOut,
)
from app.api.routes.challenges import _pick_daily, _completed_ids, safe_payload
from app.services.gamification import next_level_info

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    next_level, xp_to_next, pct = next_level_info(user.xp)

    # Courses: a course counts as completed when all its lessons are done.
    courses = db.scalars(select(Course)).all()
    done_lessons = set(
        db.scalars(
            select(LessonCompletion.lesson_id).where(LessonCompletion.user_id == user.id)
        ).all()
    )
    courses_completed = 0
    for c in courses:
        lesson_ids = {l.id for l in c.lessons}
        if lesson_ids and lesson_ids <= done_lessons:
            courses_completed += 1

    quizzes_taken = db.scalar(
        select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user.id)
    ) or 0
    challenges_completed = db.scalar(
        select(func.count()).select_from(ChallengeCompletion).where(
            ChallengeCompletion.user_id == user.id
        )
    ) or 0

    recent = db.scalars(
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(8)
    ).all()

    daily = _pick_daily(db)
    daily_out = None
    if daily:
        done = _completed_ids(db, user.id)
        daily_out = ChallengeOut(
            id=daily.id, slug=daily.slug, title=daily.title,
            description=daily.description, level=daily.level, kind=daily.kind,
            xp_reward=daily.xp_reward, payload=safe_payload(daily.payload),
            completed=daily.id in done,
        )

    return DashboardOut(
        user=UserOut.model_validate(user),
        xp_to_next_level=xp_to_next,
        next_level=next_level,
        level_progress_pct=pct,
        courses_completed=courses_completed,
        courses_total=len(courses),
        quizzes_taken=quizzes_taken,
        challenges_completed=challenges_completed,
        daily_challenge=daily_out,
        recent_activity=[ActivityOut.model_validate(a) for a in recent],
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    top = db.scalars(select(User).order_by(User.xp.desc()).limit(20)).all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            full_name=u.full_name or u.email.split("@")[0],
            xp=u.xp,
            level=u.level,
        )
        for i, u in enumerate(top)
    ]
