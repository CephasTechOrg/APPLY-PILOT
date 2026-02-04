"""Add resumes table

Revision ID: 20260202_resumes
Revises: 20260202_add_application_fields
Create Date: 2026-02-02 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "20260202_resumes"
down_revision = "20260202_add_application_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "resumes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("storage_path", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table("resumes")
