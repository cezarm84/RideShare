"""Add vehicle_type_id to rides table

Revision ID: 2f8c936ae712
Revises: 8c1b8acd7d26
Create Date: 2023-04-06

"""
from typing import Sequence, Union
from sqlalchemy import inspect

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f8c936ae712'
down_revision: Union[str, None] = '8c1b8acd7d26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add vehicle_type_id column to rides table if it doesn't exist."""
    # Check if column already exists before adding it
    conn = op.get_bind()
    insp = inspect(conn)
    columns = [col['name'] for col in insp.get_columns('rides')]
    
    if 'vehicle_type_id' not in columns:
        op.add_column('rides', sa.Column('vehicle_type_id', sa.Integer(), nullable=True))
        # Add foreign key constraint if you have a vehicle_types table
        # op.create_foreign_key(
        #     'fk_rides_vehicle_type',
        #     'rides', 'vehicle_types',
        #     ['vehicle_type_id'], ['id'],
        #     ondelete='SET NULL'
        # )
    else:
        print("Column 'vehicle_type_id' already exists in the 'rides' table. Skipping.")


def downgrade() -> None:
    """Remove vehicle_type_id column from rides table."""
    # Check if column exists before removing it
    conn = op.get_bind()
    insp = inspect(conn)
    columns = [col['name'] for col in insp.get_columns('rides')]
    
    if 'vehicle_type_id' in columns:
        # Drop foreign key first if you added it in upgrade
        # op.drop_constraint('fk_rides_vehicle_type', 'rides', type_='foreignkey')
        
        # Drop the column
        op.drop_column('rides', 'vehicle_type_id')