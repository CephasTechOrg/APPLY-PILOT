"""Add application fields

Revision ID: 20260202_add_application_fields
Revises: 20260131_profile_company_fields
Create Date: 2026-02-02 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "20260202_add_application_fields"
down_revision = "20260131_profile_company_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("applications", sa.Column("job_description", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("recruiter_name", sa.String(), nullable=True))
    op.add_column("applications", sa.Column("recruiter_email", sa.String(), nullable=True))
    op.add_column("applications", sa.Column("recruiter_phone", sa.String(), nullable=True))
    op.add_column("applications", sa.Column("interview_date", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("applications", "interview_date")
    op.drop_column("applications", "recruiter_phone")
    op.drop_column("applications", "recruiter_email")
    op.drop_column("applications", "recruiter_name")
    op.drop_column("applications", "job_description")
