"""Courses, lessons, and the Reference Channel library."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import (
    Course,
    Lesson,
    LessonCompletion,
    ReferenceChannel,
    User,
)
from app.schemas.schemas import (
    CourseDetailOut,
    CourseOut,
    LessonOut,
    ReferenceChannelOut,
)
from app.services.gamification import award_xp

router = APIRouter(tags=["content"])


def _completed_lesson_ids(db: Session, user_id: int) -> set[int]:
    rows = db.scalars(
        select(LessonCompletion.lesson_id).where(LessonCompletion.user_id == user_id)
    ).all()
    return set(rows)


@router.get("/courses", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    courses = db.scalars(select(Course).order_by(Course.order_index)).all()
    done = _completed_lesson_ids(db, user.id)
    out = []
    for c in courses:
        lesson_ids = {l.id for l in c.lessons}
        out.append(
            CourseOut(
                id=c.id, slug=c.slug, title=c.title, description=c.description,
                level=c.level, category=c.category, icon=c.icon,
                lesson_count=len(lesson_ids),
                completed_count=len(lesson_ids & done),
            )
        )
    return out


@router.get("/courses/{slug}", response_model=CourseDetailOut)
def get_course(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    course = db.scalar(select(Course).where(Course.slug == slug))
    if not course:
        raise HTTPException(404, "Course not found")
    done = _completed_lesson_ids(db, user.id)
    lessons = [
        LessonOut(
            id=l.id, title=l.title, summary=l.summary, content=l.content,
            order_index=l.order_index, xp_reward=l.xp_reward,
            completed=l.id in done,
        )
        for l in course.lessons
    ]
    lesson_ids = {l.id for l in course.lessons}
    return CourseDetailOut(
        id=course.id, slug=course.slug, title=course.title,
        description=course.description, level=course.level, category=course.category,
        icon=course.icon, lesson_count=len(lesson_ids),
        completed_count=len(lesson_ids & done), lessons=lessons,
    )


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    existing = db.scalar(
        select(LessonCompletion).where(
            LessonCompletion.user_id == user.id,
            LessonCompletion.lesson_id == lesson_id,
        )
    )
    if existing:
        return {"already_completed": True, "xp_earned": 0, "total_xp": user.xp}

    db.add(LessonCompletion(user_id=user.id, lesson_id=lesson_id))
    award_xp(db, user, lesson.xp_reward, "lesson", f"Completed lesson: {lesson.title}")
    db.commit()
    db.refresh(user)
    return {"already_completed": False, "xp_earned": lesson.xp_reward, "total_xp": user.xp}


@router.get("/reference-channels", response_model=list[ReferenceChannelOut])
def reference_channels(db: Session = Depends(get_db)):
    return db.scalars(select(ReferenceChannel).order_by(ReferenceChannel.id)).all()


@router.get("/reference-channels/{slug}", response_model=ReferenceChannelOut)
def reference_channel(slug: str, db: Session = Depends(get_db)):
    channel = db.scalar(select(ReferenceChannel).where(ReferenceChannel.slug == slug))
    if not channel:
        raise HTTPException(404, "Channel not found")
    return channel
