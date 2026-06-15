from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Quiz, QuizQuestion, QuizAttempt, User
from app.schemas.schemas import (
    QuestionCorrection,
    QuizDetailOut,
    QuizOut,
    QuizQuestionOut,
    QuizResultOut,
    QuizSubmission,
)
from app.services.gamification import award_xp

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

XP_PER_CORRECT = 25


@router.get("", response_model=list[QuizOut])
def list_quizzes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quizzes = db.scalars(select(Quiz).order_by(Quiz.id)).all()
    return [
        QuizOut(
            id=q.id, slug=q.slug, title=q.title, topic=q.topic, level=q.level,
            description=q.description, question_count=len(q.questions),
        )
        for q in quizzes
    ]


@router.get("/{slug}", response_model=QuizDetailOut)
def get_quiz(slug: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.scalar(select(Quiz).where(Quiz.slug == slug))
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    return QuizDetailOut(
        id=quiz.id, slug=quiz.slug, title=quiz.title, topic=quiz.topic,
        level=quiz.level, description=quiz.description,
        question_count=len(quiz.questions),
        questions=[
            QuizQuestionOut(id=q.id, prompt=q.prompt, options=q.options)
            for q in quiz.questions
        ],
    )


@router.post("/{slug}/submit", response_model=QuizResultOut)
def submit_quiz(
    slug: str,
    body: QuizSubmission,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quiz = db.scalar(select(Quiz).where(Quiz.slug == slug))
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    corrections: list[QuestionCorrection] = []
    score = 0
    for q in quiz.questions:
        chosen = body.answers.get(q.id, -1)
        was_correct = chosen == q.correct_index
        if was_correct:
            score += 1
        corrections.append(
            QuestionCorrection(
                question_id=q.id,
                correct_index=q.correct_index,
                explanation=q.explanation,
                was_correct=was_correct,
            )
        )

    xp_earned = score * XP_PER_CORRECT
    db.add(
        QuizAttempt(
            user_id=user.id, quiz_id=quiz.id, score=score,
            total=len(quiz.questions), xp_earned=xp_earned,
        )
    )
    if xp_earned:
        award_xp(db, user, xp_earned, "quiz", f"Scored {score}/{len(quiz.questions)} on {quiz.title}")
    db.commit()

    return QuizResultOut(
        score=score, total=len(quiz.questions),
        xp_earned=xp_earned, corrections=corrections,
    )
