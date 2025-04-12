"""merge_branches

Revision ID: 1abf5d536cad
Revises: 2e5c2e4878c0, <auto_generated_id>
Create Date: 2025-04-06 22:04:22.322848

"""

from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = "1abf5d536cad"
down_revision: Union[str, None] = ("2e5c2e4878c0", "<auto_generated_id>")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
