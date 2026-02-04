"""merge_heads

Revision ID: 9e571f639850
Revises: 20260130_application_events, 20260203_resume_templates
Create Date: 2026-02-03 22:32:11.954914

"""

from alembic import op
import sqlalchemy as sa


revision = '9e571f639850'
down_revision = ('20260130_application_events', '20260203_resume_templates')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
