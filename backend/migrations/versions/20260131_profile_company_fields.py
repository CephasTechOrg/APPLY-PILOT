"""Profile company fields

Revision ID: 20260131_profile_company_fields
Revises: 20260131_profiles
Create Date: 2026-01-31 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "20260131_profile_company_fields"
down_revision = "20260131_profiles"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("profiles", sa.Column("education_level", sa.String(), nullable=True))
    op.add_column("profiles", sa.Column("school", sa.String(), nullable=True))
    op.add_column("profiles", sa.Column("graduation_year", sa.Integer(), nullable=True))
    op.add_column("profiles", sa.Column("certifications", sa.Text(), nullable=True))
    op.add_column("profiles", sa.Column("work_authorization", sa.String(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("visa_sponsorship_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("profiles", sa.Column("years_experience", sa.Integer(), nullable=True))
    op.add_column("profiles", sa.Column("industry", sa.String(), nullable=True))
    op.add_column("profiles", sa.Column("languages", sa.String(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("relocation_open", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("profiles", sa.Column("remote_preference", sa.String(), nullable=True))
    op.add_column("profiles", sa.Column("salary_expectation", sa.String(), nullable=True))
    op.add_column("profiles", sa.Column("notice_period", sa.String(), nullable=True))


def downgrade():
    op.drop_column("profiles", "notice_period")
    op.drop_column("profiles", "salary_expectation")
    op.drop_column("profiles", "remote_preference")
    op.drop_column("profiles", "relocation_open")
    op.drop_column("profiles", "languages")
    op.drop_column("profiles", "industry")
    op.drop_column("profiles", "years_experience")
    op.drop_column("profiles", "visa_sponsorship_required")
    op.drop_column("profiles", "work_authorization")
    op.drop_column("profiles", "certifications")
    op.drop_column("profiles", "graduation_year")
    op.drop_column("profiles", "school")
    op.drop_column("profiles", "education_level")
