"""Add emails table for tracking email content and deadlines.

Revision ID: 20260204_emails
Revises: 20260202_refresh_tokens
Create Date: 2026-02-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260204_emails'
down_revision = '20260202_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create emails table
    op.create_table(
        'emails',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_content', sa.Text(), nullable=False),
        sa.Column('parsed_summary', sa.Text(), nullable=True),
        sa.Column('key_deadlines', sa.Text(), nullable=True),
        sa.Column('extracted_dates', sa.Text(), nullable=True),
        sa.Column('key_details', sa.Text(), nullable=True),
        sa.Column('ai_confidence', sa.String(length=50), nullable=True),
        sa.Column('source_company', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices
    op.create_index(op.f('ix_emails_id'), 'emails', ['id'], unique=False)
    op.create_index(op.f('ix_emails_user_id'), 'emails', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_emails_user_id'), table_name='emails')
    op.drop_index(op.f('ix_emails_id'), table_name='emails')
    op.drop_table('emails')
