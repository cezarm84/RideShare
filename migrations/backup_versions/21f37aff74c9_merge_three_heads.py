"""merge three heads

Revision ID: 21f37aff74c9
Revises: 1abf5d536cad, 2f8c936ae712, add_vehicle_type_to_rides
Create Date: 2025-04-07 00:02:28.093443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21f37aff74c9'
down_revision: Union[str, None] = ('1abf5d536cad', '2f8c936ae712', 'add_vehicle_type_to_rides')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
