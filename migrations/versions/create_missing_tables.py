"""create missing tables for hub and location references

Revision ID: create_missing_tables
Revises: <previous_revision_id>
Create Date: 2023-11-14

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "create_missing_tables"
down_revision = None  # Replace with previous migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Create hubs table if it doesn't exist
    op.create_table(
        "hubs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("postal_code", sa.String(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Check if locations table exists, create if needed
    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("location_type", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("postal_code", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("is_favorite", sa.Boolean(), nullable=True),
        sa.Column("enterprise_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["enterprise_id"],
            ["enterprises.id"],
        ),
    )

    # Add origin_location_id and destination_location_id columns to rides table
    with op.batch_alter_table("rides") as batch_op:
        batch_op.add_column(
            sa.Column("origin_location_id", sa.Integer(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("destination_location_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_ride_origin_location", "locations", ["origin_location_id"], ["id"]
        )
        batch_op.create_foreign_key(
            "fk_ride_destination_location",
            "locations",
            ["destination_location_id"],
            ["id"],
        )


def downgrade():
    # Remove foreign keys and columns from rides table
    with op.batch_alter_table("rides") as batch_op:
        batch_op.drop_constraint("fk_ride_origin_location", type_="foreignkey")
        batch_op.drop_constraint("fk_ride_destination_location", type_="foreignkey")
        batch_op.drop_column("origin_location_id")
        batch_op.drop_column("destination_location_id")

    # Drop tables
    op.drop_table("locations")
    op.drop_table("hubs")
