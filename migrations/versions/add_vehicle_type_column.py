"""Add vehicle_type_id to rides table

Revision ID: 2f8c936ae712
Revises: 8c1b8acd7d26
Create Date: 2023-04-06 22:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2f8c936ae712"
down_revision = "8c1b8acd7d26"  # Update this to match your most recent migration
branch_labels = None
depends_on = None


def upgrade():
    # Add vehicle_type_id column to rides table
    op.add_column("rides", sa.Column("vehicle_type_id", sa.Integer(), nullable=True))

    # Add foreign key constraint to vehicle_types table
    op.create_foreign_key(
        "fk_rides_vehicle_type", "rides", "vehicle_types", ["vehicle_type_id"], ["id"]
    )


def downgrade():
    # Drop foreign key first
    op.drop_constraint("fk_rides_vehicle_type", "rides", type_="foreignkey")

    # Drop the column
    op.drop_column("rides", "vehicle_type_id")
