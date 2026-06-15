from sqlalchemy import Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    level: Mapped[str] = mapped_column(String(40))  # beginner | intermediate | advanced
    category: Mapped[str] = mapped_column(String(60), default="foundations")
    icon: Mapped[str] = mapped_column(String(40), default="GraduationCap")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)

    course: Mapped["Course"] = relationship(back_populates="lessons")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(80))
    level: Mapped[str] = mapped_column(String(40), default="beginner")
    description: Mapped[str] = mapped_column(Text, default="")

    questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON)  # list[str]
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(Text, default="")

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    level: Mapped[str] = mapped_column(String(40), default="beginner")
    kind: Mapped[str] = mapped_column(String(40), default="daily")  # daily | broll | editing
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)  # question/options/answer


class ReferenceChannel(Base):
    __tablename__ = "reference_channels"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    editing_style: Mapped[str] = mapped_column(Text, default="")
    learn: Mapped[list] = mapped_column(JSON, default=list)  # list[str]
    recommended_videos: Mapped[list] = mapped_column(JSON, default=list)
    accent: Mapped[str] = mapped_column(String(20), default="violet")
    youtube_url: Mapped[str] = mapped_column(String(300), default="")
