"""XP, levels, and streak logic — the heart of the gamification system."""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import ActivityLog, User

# XP thresholds for each level (must match User.level)
LEVEL_THRESHOLDS = [
    ("Beginner", 0),
    ("Intermediate", 500),
    ("Advanced", 2000),
    ("Professional", 5000),
]


def level_for_xp(xp: int) -> str:
    current = "Beginner"
    for name, threshold in LEVEL_THRESHOLDS:
        if xp >= threshold:
            current = name
    return current


def next_level_info(xp: int) -> tuple[str, int, int]:
    """Return (next_level_name, xp_to_next, progress_pct_within_band)."""
    for i, (name, threshold) in enumerate(LEVEL_THRESHOLDS):
        if xp < threshold:
            prev_threshold = LEVEL_THRESHOLDS[i - 1][1] if i > 0 else 0
            band = threshold - prev_threshold
            into = xp - prev_threshold
            pct = int((into / band) * 100) if band else 100
            return name, threshold - xp, max(0, min(100, pct))
    # Already at top level
    return "Professional", 0, 100


def award_xp(db: Session, user: User, amount: int, kind: str, description: str) -> None:
    """Add XP, log the activity, and refresh the daily streak. Caller commits."""
    user.xp += amount
    db.add(ActivityLog(user_id=user.id, kind=kind, description=description, xp=amount))
    _touch_streak(db, user)


def _touch_streak(db: Session, user: User) -> None:
    today = date.today()
    last = user.last_active_date
    if last == today:
        return  # already counted today
    if last == today - timedelta(days=1):
        user.streak_days += 1
    else:
        user.streak_days = 1
    user.last_active_date = today
