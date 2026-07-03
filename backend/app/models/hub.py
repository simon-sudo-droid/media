"""Models for the Learning Hub glossary, Tracker Analytics, and Guide & Help."""
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TrackerEntry(Base):
    """A daily work-log entry, attributed to the editor who created it."""
    __tablename__ = "tracker_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True)
    output_link: Mapped[str] = mapped_column(Text, default="")
    episode: Mapped[str] = mapped_column(String(120), default="")
    clip_name: Mapped[str] = mapped_column(String(255), default="")
    leadership_month: Mapped[str] = mapped_column(String(60), default="")
    leadership_day: Mapped[str] = mapped_column(String(20), default="")
    case_study_reel: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id: Mapped[int] = mapped_column(primary_key=True)
    term: Mapped[str] = mapped_column(String(120), index=True)
    definition: Mapped[str] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class HelpQuestion(Base):
    __tablename__ = "help_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text, default="")
    answered: Mapped[bool] = mapped_column(Boolean, default=False)
    promoted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FaqEntry(Base):
    __tablename__ = "faq_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ChangelogEntry(Base):
    __tablename__ = "changelog_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_date: Mapped[str] = mapped_column(String(20), default="")   # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    tag: Mapped[str] = mapped_column(String(40), default="Update")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
