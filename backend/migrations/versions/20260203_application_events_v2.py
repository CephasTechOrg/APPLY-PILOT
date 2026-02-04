"""Enhance application_events with AI email parsing fields

Revision ID: 20260203_application_events_v2
Revises: 20260203_cover_letters
Create Date: 2026-02-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260203_application_events_v2'
down_revision = '20260203_cover_letters'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to application_events table
    op.add_column('application_events', sa.Column('event_type', sa.String(50), nullable=True))
    op.add_column('application_events', sa.Column('source', sa.String(50), nullable=True))
    op.add_column('application_events', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('application_events', sa.Column('raw_content', sa.Text(), nullable=True))
    op.add_column('application_events', sa.Column('action_required', sa.Boolean(), nullable=True))
    op.add_column('application_events', sa.Column('action_description', sa.String(500), nullable=True))
    op.add_column('application_events', sa.Column('action_deadline', sa.DateTime(timezone=True), nullable=True))
    op.add_column('application_events', sa.Column('action_completed', sa.Boolean(), nullable=True))
    op.add_column('application_events', sa.Column('ai_suggestions', postgresql.JSONB(), nullable=True))
    op.add_column('application_events', sa.Column('event_date', sa.DateTime(timezone=True), nullable=True))
    
    # Set defaults for existing rows
    op.execute("UPDATE application_events SET event_type = 'status_change' WHERE event_type IS NULL")
    op.execute("UPDATE application_events SET source = 'system' WHERE source IS NULL")
    op.execute("UPDATE application_events SET action_required = false WHERE action_required IS NULL")
    op.execute("UPDATE application_events SET action_completed = false WHERE action_completed IS NULL")
    
    # Make event_type and source NOT NULL after setting defaults
    op.alter_column('application_events', 'event_type', nullable=False)
    op.alter_column('application_events', 'source', nullable=False)
    op.alter_column('application_events', 'action_required', nullable=False, server_default='false')
    op.alter_column('application_events', 'action_completed', nullable=False, server_default='false')
    
    # Make new_status nullable (not needed for non-status-change events)
    op.alter_column('application_events', 'new_status', nullable=True)


def downgrade():
    # Remove new columns
    op.drop_column('application_events', 'event_date')
    op.drop_column('application_events', 'ai_suggestions')
    op.drop_column('application_events', 'action_completed')
    op.drop_column('application_events', 'action_deadline')
    op.drop_column('application_events', 'action_description')
    op.drop_column('application_events', 'action_required')
    op.drop_column('application_events', 'raw_content')
    op.drop_column('application_events', 'summary')
    op.drop_column('application_events', 'source')
    op.drop_column('application_events', 'event_type')
    
    # Make new_status NOT NULL again
    op.alter_column('application_events', 'new_status', nullable=False)
