"""Application events

Revision ID: 20260130_application_events
Revises: 20260130_password_reset_tokens
Create Date: 2026-01-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "20260130_application_events"
down_revision = "20260130_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "application_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("old_status", sa.String(), nullable=True),
        sa.Column("new_status", sa.String(), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])
    op.create_index("ix_application_events_user_id", "application_events", ["user_id"])


def downgrade():
    op.drop_index("ix_application_events_user_id", table_name="application_events")
    op.drop_index("ix_application_events_application_id", table_name="application_events")
    op.drop_table("application_events")
