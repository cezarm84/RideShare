"""merge_multiple_heads

Revision ID: 8c1b8acd7d26
Revises: 93dc3498f79f, create_missing_tables
Create Date: 2025-04-06 21:55:33.301918

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "8c1b8acd7d26"
down_revision: Union[str, None] = ("93dc3498f79f", "create_missing_tables")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
