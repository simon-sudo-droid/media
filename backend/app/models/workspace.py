"""Content Workspace — real work content + the team learning knowledge base."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkContent(Base):
    """A piece of real content the team is editing (bridges learning → doing).

    category: 'leadership' (Monthly Leadership Content) or 'case_study'
    (Leadership Case Studies).
    """
    __tablename__ = "work_content"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(30), index=True, default="leadership")
    title: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(60), default="Script")   # LinkedIn post, Reel script, Article…
    platform: Mapped[str] = mapped_column(String(60), default="")             # LinkedIn, Instagram, Facebook, YouTube…
    body: Mapped[str] = mapped_column(Text, default="")                       # script / post body
    status: Mapped[str] = mapped_column(String(30), default="Draft")          # Draft/Ready for Edit/In Editing/In Review/Published
    notes: Mapped[str] = mapped_column(Text, default="")
    links: Mapped[str] = mapped_column(Text, default="")                      # one URL per line (supporting docs)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class LearningEntry(Base):
    """Weekly Learning Log entry — doubles as the Shared Learning Library.

    Includes the Knowledge-to-Action answers so every logged resource is
    pushed toward practical application.
    """
    __tablename__ = "learning_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entry_date: Mapped[str] = mapped_column(String(20), index=True, default="")  # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[str] = mapped_column(String(40), default="Video")   # Video/Article/Course/Blog/Tool/Prompt…
    url: Mapped[str] = mapped_column(String(600), default="")
    summary: Mapped[str] = mapped_column(Text, default="")                    # what was learned
    takeaways: Mapped[str] = mapped_column(Text, default="")                  # key takeaways
    workflow_impact: Mapped[str] = mapped_column(Text, default="")            # how it improves editing workflows
    apply_plan: Mapped[str] = mapped_column(Text, default="")                 # how the editor plans to apply it
    tags: Mapped[str] = mapped_column(String(400), default="")                # comma-separated
    # Knowledge-to-Action
    why_useful: Mapped[str] = mapped_column(Text, default="")
    project_target: Mapped[str] = mapped_column(Text, default="")             # which project to apply it to
    do_differently: Mapped[str] = mapped_column(Text, default="")
    team_adopt: Mapped[bool] = mapped_column(Boolean, default=False)          # should the team adopt this workflow?
    worth_sharing: Mapped[bool] = mapped_column(Boolean, default=False)       # highlight to everyone
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
