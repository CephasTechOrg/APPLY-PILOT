"""Add ai_requests table

Revision ID: 20260202_ai_requests
Revises: 20260202_app_resume
Create Date: 2026-02-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260202_ai_requests"
down_revision = "20260202_app_resume"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("tool", sa.String(), nullable=False, index=True),
        sa.Column("status", sa.String(), nullable=False, server_default="success"),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("input_data", sa.JSON(), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("ai_requests")
