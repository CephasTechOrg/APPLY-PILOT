"""Add resume_id to applications table

Revision ID: 20260202_app_resume
Revises: 20260202_resumes
Create Date: 2026-02-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260202_app_resume'
down_revision = '20260202_resumes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add resume_id column to applications table
    op.add_column('applications', sa.Column('resume_id', sa.Integer(), nullable=True))
    # Create foreign key constraint
    op.create_foreign_key('fk_applications_resume_id', 'applications', 'resumes', ['resume_id'], ['id'])
    # Create index for better query performance
    op.create_index('ix_applications_resume_id', 'applications', ['resume_id'])


def downgrade() -> None:
    # Remove index and foreign key
    op.drop_index('ix_applications_resume_id', 'applications')
    op.drop_constraint('fk_applications_resume_id', 'applications', type_='foreignkey')
    # Remove column
    op.drop_column('applications', 'resume_id')
