"""add_hub_and_location_columns

Revision ID: 2e5c2e4878c0
Revises: 8c1b8acd7d26
Create Date: 2025-04-06 22:02:39.714753

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2e5c2e4878c0'
down_revision: Union[str, None] = '8c1b8acd7d26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add columns without constraints to avoid SQLite limitations
    op.add_column('hubs', sa.Column('city', sa.String(), nullable=True))
    op.add_column('hubs', sa.Column('postal_code', sa.String(), nullable=True))
    op.add_column('hubs', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    op.add_column('locations', sa.Column('city', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('postal_code', sa.String(), nullable=True))
    op.add_column('locations', sa.Column('description', sa.String(), nullable=True))
    
    op.add_column('rides', sa.Column('origin_location_id', sa.Integer(), nullable=True))
    op.add_column('rides', sa.Column('destination_location_id', sa.Integer(), nullable=True))
    
    # Skip foreign key constraints for SQLite compatibility


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('rides', 'destination_location_id')
    op.drop_column('rides', 'origin_location_id')
    op.drop_column('locations', 'description')
    op.drop_column('locations', 'postal_code')
    op.drop_column('locations', 'city')
    op.drop_column('hubs', 'updated_at')
    op.drop_column('hubs', 'postal_code')
    op.drop_column('hubs', 'city')
