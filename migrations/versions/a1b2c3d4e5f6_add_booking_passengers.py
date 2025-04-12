"""add booking passengers

Revision ID: a1b2c3d4e5f6
Revises: 1abf5d536cad
Create Date: 2025-04-10 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "1abf5d536cad"
branch_labels = None
depends_on = None


def upgrade():
    # Table already created directly in the database
    pass


def downgrade():
    # Drop table and indexes if needed
    op.execute("DROP INDEX IF EXISTS ix_booking_passengers_user_id")
    op.execute("DROP INDEX IF EXISTS ix_booking_passengers_booking_id")
    op.execute("DROP TABLE IF EXISTS booking_passengers")
