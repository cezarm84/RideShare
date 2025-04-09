"""
add payment_methods table

Revision ID: 64c6fd146e9f
Revises: a1b2c3d4e5f6
Create Date: 2025-04-10T00:45:48.249900

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision = '64c6fd146e9f'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Table already created directly in the database
    pass


def downgrade():
    # Drop table and indexes if needed
    op.execute('DROP INDEX IF EXISTS ix_payment_methods_method_type')
    op.execute('DROP INDEX IF EXISTS ix_payment_methods_user_id')
    op.execute('DROP TABLE IF EXISTS payment_methods')
