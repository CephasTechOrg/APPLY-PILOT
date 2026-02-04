"""Add raw_text column to resume_content table

Revision ID: 20260204_add_raw_text
Revises: 20260204_emails
Create Date: 2026-02-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260204_add_raw_text'
down_revision = '20260204_emails'
branch_labels = None
depends_on = None


def upgrade():
    # Add raw_text column to resume_contents table
    op.add_column('resume_contents', sa.Column('raw_text', sa.Text(), nullable=True))


def downgrade():
    # Remove raw_text column from resume_contents table
    op.drop_column('resume_contents', 'raw_text')
