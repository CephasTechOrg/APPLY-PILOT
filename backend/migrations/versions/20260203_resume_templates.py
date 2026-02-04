"""Resume content and template tables

Revision ID: 20260203_resume_templates
Revises: 20260202_notifications
Create Date: 2026-02-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260203_resume_templates'
down_revision: Union[str, None] = '20260202_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create extraction_status enum using raw SQL to avoid duplicate creation
    op.execute("DROP TYPE IF EXISTS extractionstatus")
    op.execute("CREATE TYPE extractionstatus AS ENUM ('pending', 'processing', 'completed', 'failed')")

    # Create resume_contents table
    op.create_table(
        'resume_contents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('structured_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('extraction_status', postgresql.ENUM('pending', 'processing', 'completed', 'failed', name='extractionstatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('extraction_error', sa.Text(), nullable=True),
        sa.Column('purpose', sa.String(length=50), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('language', sa.String(length=10), server_default='en', nullable=True),
        sa.Column('tone', sa.String(length=20), server_default='professional', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resume_contents_id'), 'resume_contents', ['id'], unique=False)
    op.create_index(op.f('ix_resume_contents_resume_id'), 'resume_contents', ['resume_id'], unique=True)

    # Create resume_templates table
    op.create_table(
        'resume_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('template_type', sa.String(length=20), server_default='resume', nullable=False),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('css_content', sa.Text(), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('version', sa.String(length=20), server_default='1.0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resume_templates_id'), 'resume_templates', ['id'], unique=False)
    op.create_index(op.f('ix_resume_templates_slug'), 'resume_templates', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_resume_templates_slug'), table_name='resume_templates')
    op.drop_index(op.f('ix_resume_templates_id'), table_name='resume_templates')
    op.drop_table('resume_templates')

    op.drop_index(op.f('ix_resume_contents_resume_id'), table_name='resume_contents')
    op.drop_index(op.f('ix_resume_contents_id'), table_name='resume_contents')
    op.drop_table('resume_contents')

    # Drop enum
    sa.Enum(name='extractionstatus').drop(op.get_bind(), checkfirst=True)
