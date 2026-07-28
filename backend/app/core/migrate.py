"""Additive, idempotent schema migrations.

`Base.metadata.create_all()` creates new *tables* but never alters existing
ones, so new columns on existing tables are applied here. Every statement is
written to be safe to run on every startup (ADD COLUMN IF NOT EXISTS), which
keeps deploys reliable without pulling in Alembic.

Only additive changes belong here — never drop or rewrite user data.
"""
from __future__ import annotations

import logging

from sqlalchemy import text

logger = logging.getLogger("editmentor")

# (table, column, type + default) — applied in order, all idempotent.
ADD_COLUMNS: list[tuple[str, str, str]] = [
    ("work_content", "owner", "VARCHAR(120) DEFAULT ''"),
    ("work_content", "due_date", "VARCHAR(20) DEFAULT ''"),
    ("work_content", "order_index", "INTEGER DEFAULT 0"),
    ("learning_entries", "content_id", "INTEGER"),
    ("work_content", "editing_by", "INTEGER"),
    ("work_content", "editing_at", "TIMESTAMPTZ"),
]


def run_migrations(engine) -> None:
    with engine.begin() as conn:
        for table, column, spec in ADD_COLUMNS:
            try:
                conn.execute(text(f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "{column}" {spec}'))
            except Exception as exc:  # pragma: no cover - defensive
                # A missing table just means create_all will make it fresh
                # (with the column already included), so this is not fatal.
                logger.warning("migration skipped %s.%s: %s", table, column, exc)
