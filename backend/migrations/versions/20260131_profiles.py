"""Profiles table

Revision ID: 20260131_profiles
Revises: 20260130_password_reset_tokens
Create Date: 2026-01-31 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "20260131_profiles"
down_revision = "20260130_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("headline", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("time_zone", sa.String(), nullable=True),
        sa.Column("current_title", sa.String(), nullable=True),
        sa.Column("current_company", sa.String(), nullable=True),
        sa.Column("experience_level", sa.String(), nullable=True),
        sa.Column("preferred_role", sa.String(), nullable=True),
        sa.Column("portfolio_url", sa.String(), nullable=True),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("github_url", sa.String(), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("open_to_work", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_profiles_user_id", "profiles", ["user_id"], unique=True)


def downgrade():
    op.drop_index("ix_profiles_user_id", table_name="profiles")
    op.drop_table("profiles")
