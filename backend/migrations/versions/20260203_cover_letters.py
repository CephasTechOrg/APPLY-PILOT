"""Create cover_letters table

Revision ID: 20260203_cover_letters
Revises: 20260203_merge_heads
Create Date: 2026-02-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260203_cover_letters"
down_revision: Union[str, None] = "9e571f639850"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cover_letters",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=True),
        sa.Column("template_slug", sa.String(length=50), nullable=False, server_default="formal"),
        sa.Column("design_tokens", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False, server_default="Untitled Cover Letter"),
        sa.Column("is_template", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cover_letters_id"), "cover_letters", ["id"], unique=False)
    op.create_index(op.f("ix_cover_letters_user_id"), "cover_letters", ["user_id"], unique=False)
    op.create_index(op.f("ix_cover_letters_application_id"), "cover_letters", ["application_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cover_letters_application_id"), table_name="cover_letters")
    op.drop_index(op.f("ix_cover_letters_user_id"), table_name="cover_letters")
    op.drop_index(op.f("ix_cover_letters_id"), table_name="cover_letters")
    op.drop_table("cover_letters")
