"""
add user_preferences table

Revision ID: 32d34dde7e66
Revises: eb25ad6dcc0d
Create Date: 2025-04-10T00:49:03.291055

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision = '32d34dde7e66'
down_revision = 'eb25ad6dcc0d'
branch_labels = None
depends_on = None


def upgrade():
    # Table already created directly in the database
    pass


def downgrade():
    # Drop table and indexes if needed
    op.drop_index('ix_user_preferences_user_id', table_name='user_preferences')
    op.drop_table('user_preferences')
