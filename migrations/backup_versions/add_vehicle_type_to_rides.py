"""Add vehicle_type_id to rides table

Revision ID: add_vehicle_type_to_rides
Revises:
Create Date: 2023-04-06

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_vehicle_type_to_rides"
down_revision: Union[str, None] = (
    None  # This will be set to the merged head ID after running 'alembic merge'
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add vehicle_type_id column to rides table."""
    # Add vehicle_type_id column with a default value of NULL
    op.add_column("rides", sa.Column("vehicle_type_id", sa.Integer(), nullable=True))

    # Add foreign key constraint if you have a vehicle_types table
    # Uncomment if you have a vehicle_types table
    # op.create_foreign_key(
    #     'fk_rides_vehicle_type',
    #     'rides', 'vehicle_types',
    #     ['vehicle_type_id'], ['id'],
    #     ondelete='SET NULL'
    # )


def downgrade() -> None:
    """Remove vehicle_type_id column from rides table."""
    # Drop foreign key first if you added it in upgrade
    # op.drop_constraint('fk_rides_vehicle_type', 'rides', type_='foreignkey')

    # Drop the column
    op.drop_column("rides", "vehicle_type_id")
