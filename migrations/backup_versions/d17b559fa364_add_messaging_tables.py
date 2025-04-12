"""Add messaging tables

Revision ID: d17b559fa364
Revises:
Create Date: 2025-04-05 23:46:33.770595

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d17b559fa364"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name):
    """Check if a table exists in the database."""
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    """Upgrade schema."""
    # Get the database connection
    conn = op.get_bind()

    # Create geocoding_cache table if it doesn't exist
    if not table_exists("geocoding_cache"):
        op.create_table(
            "geocoding_cache",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("address", sa.String(), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("coordinates", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("last_used", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_geocoding_cache_address"),
            "geocoding_cache",
            ["address"],
            unique=True,
        )
        op.create_index(
            op.f("ix_geocoding_cache_id"), "geocoding_cache", ["id"], unique=False
        )

    # Create user_message_settings table if it doesn't exist
    if not table_exists("user_message_settings"):
        op.create_table(
            "user_message_settings",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("notifications_enabled", sa.Boolean(), nullable=True),
            sa.Column("sound_enabled", sa.Boolean(), nullable=True),
            sa.Column("auto_delete_after_days", sa.Integer(), nullable=True),
            sa.Column("show_read_receipts", sa.Boolean(), nullable=True),
            sa.ForeignKeyConstraint(
                ["user_id"],
                ["users.id"],
            ),
            sa.PrimaryKeyConstraint("user_id"),
        )

    # Create conversations table if it doesn't exist
    if not table_exists("conversations"):
        op.create_table(
            "conversations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=True),
            sa.Column("ride_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.Column("conversation_type", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(
                ["ride_id"],
                ["rides.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_conversations_id"), "conversations", ["id"], unique=False
        )

    # Create conversation_participants table if it doesn't exist
    if not table_exists("conversation_participants"):
        op.create_table(
            "conversation_participants",
            sa.Column("conversation_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(
                ["conversation_id"],
                ["conversations.id"],
            ),
            sa.ForeignKeyConstraint(
                ["user_id"],
                ["users.id"],
            ),
            sa.PrimaryKeyConstraint("conversation_id", "user_id"),
        )

    # Create messages table if it doesn't exist
    if not table_exists("messages"):
        op.create_table(
            "messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("conversation_id", sa.Integer(), nullable=False),
            sa.Column("sender_id", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("sent_at", sa.DateTime(), nullable=True),
            sa.Column("read_at", sa.DateTime(), nullable=True),
            sa.Column("is_system_message", sa.Boolean(), nullable=True),
            sa.Column("message_type", sa.String(), nullable=True),
            sa.Column("message_metadata", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(
                ["conversation_id"],
                ["conversations.id"],
            ),
            sa.ForeignKeyConstraint(
                ["sender_id"],
                ["users.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_messages_id"), "messages", ["id"], unique=False)

    # Skip the alter_column operation for SQLite
    if table_exists("payments") and "sqlite" not in conn.dialect.name:
        # For other databases, perform the original operation
        op.alter_column(
            "payments", "status", existing_type=sa.VARCHAR(), nullable=False
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Get the database connection
    conn = op.get_bind()

    # Skip the alter_column operation for SQLite
    if table_exists("payments") and "sqlite" not in conn.dialect.name:
        op.alter_column("payments", "status", existing_type=sa.VARCHAR(), nullable=True)

    # Drop tables in reverse order of creation
    if table_exists("messages"):
        op.drop_index(op.f("ix_messages_id"), table_name="messages")
        op.drop_table("messages")

    if table_exists("conversation_participants"):
        op.drop_table("conversation_participants")

    if table_exists("conversations"):
        op.drop_index(op.f("ix_conversations_id"), table_name="conversations")
        op.drop_table("conversations")

    if table_exists("user_message_settings"):
        op.drop_table("user_message_settings")

    if table_exists("geocoding_cache"):
        op.drop_index(op.f("ix_geocoding_cache_id"), table_name="geocoding_cache")
        op.drop_index(op.f("ix_geocoding_cache_address"), table_name="geocoding_cache")
        op.drop_table("geocoding_cache")
