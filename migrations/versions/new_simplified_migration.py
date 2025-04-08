"""add_hub_and_location_columns

Revision ID: <auto_generated_id>
Revises: 8c1b8acd7d26
Create Date: 2023-11-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy import inspect

# revision identifiers, used by Alembic - don't change these!
# revision will be auto-generated when you create the file
revision = '<auto_generated_id>'
down_revision = '8c1b8acd7d26'
branch_labels = None
depends_on = None


def column_exists(table, column):
    """Check if column exists in table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table)]
    return column in columns


def add_column_safe(table, column):
    """Add column if it doesn't exist"""
    if not column_exists(table, column.name):
        op.add_column(table, column)


def upgrade():
    # Add columns safely to 'hubs'
    add_column_safe('hubs', sa.Column('city', sa.String(), nullable=True))
    add_column_safe('hubs', sa.Column('postal_code', sa.String(), nullable=True))
    add_column_safe('hubs', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add columns safely to 'locations'
    add_column_safe('locations', sa.Column('city', sa.String(), nullable=True))
    add_column_safe('locations', sa.Column('postal_code', sa.String(), nullable=True))
    add_column_safe('locations', sa.Column('description', sa.String(), nullable=True))
    
    # Add columns safely to 'rides'
    add_column_safe('rides', sa.Column('origin_location_id', sa.Integer(), nullable=True))
    add_column_safe('rides', sa.Column('destination_location_id', sa.Integer(), nullable=True))
    
    # Skip foreign key constraints for SQLite compatibility
    # SQLAlchemy will still enforce these constraints at the ORM level


def downgrade():
    # Only attempt to drop columns that might have been added
    for column in ['destination_location_id', 'origin_location_id']:
        if column_exists('rides', column):
            op.drop_column('rides', column)
    
    for column in ['description', 'postal_code', 'city']:
        if column_exists('locations', column):
            op.drop_column('locations', column)
    
    for column in ['updated_at', 'postal_code', 'city']:
        if column_exists('hubs', column):
            op.drop_column('hubs', column)
