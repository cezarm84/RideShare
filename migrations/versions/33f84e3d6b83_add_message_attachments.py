"""add message attachments

Revision ID: 33f84e3d6b83
Revises: d17b559fa364
Create Date: 2025-04-06 00:20:37.112252

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "33f84e3d6b83"
down_revision: Union[str, None] = "d17b559fa364"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
