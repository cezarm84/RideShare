"""Add matching tables

Revision ID: 20230515_add_matching_tables
Revises: 
Create Date: 2023-05-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '20230515_add_matching_tables'
down_revision = None  # Set this to the previous migration ID in your system
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('preferred_starting_hub_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('preferred_vehicle_type_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('max_walking_distance_meters', sa.Integer(), nullable=True, server_default='1000'))
    op.add_column('users', sa.Column('max_detour_minutes', sa.Integer(), nullable=True, server_default='15'))
    op.add_column('users', sa.Column('max_wait_minutes', sa.Integer(), nullable=True, server_default='10'))
    
    # Add foreign key constraints
    op.create_foreign_key('fk_users_preferred_hub', 'users', 'hubs', ['preferred_starting_hub_id'], ['id'])
    op.create_foreign_key('fk_users_preferred_vehicle_type', 'users', 'vehicle_types', ['preferred_vehicle_type_id'], ['id'])
    
    # Create user_travel_patterns table
    op.create_table(
        'user_travel_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('origin_type', sa.String(), nullable=False),
        sa.Column('origin_id', sa.Integer(), nullable=True),
        sa.Column('origin_latitude', sa.Float(), nullable=False),
        sa.Column('origin_longitude', sa.Float(), nullable=False),
        sa.Column('destination_type', sa.String(), nullable=False),
        sa.Column('destination_id', sa.Integer(), nullable=True),
        sa.Column('destination_latitude', sa.Float(), nullable=False),
        sa.Column('destination_longitude', sa.Float(), nullable=False),
        sa.Column('departure_time', sa.Time(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('frequency', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_traveled', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_travel_patterns_id'), 'user_travel_patterns', ['id'], unique=False)
    op.create_index(op.f('ix_user_travel_patterns_user_id'), 'user_travel_patterns', ['user_id'], unique=False)
    
    # Create user_matching_preferences table
    op.create_table(
        'user_matching_preferences',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('max_detour_minutes', sa.Integer(), nullable=True, server_default='15'),
        sa.Column('max_wait_minutes', sa.Integer(), nullable=True, server_default='10'),
        sa.Column('max_walking_distance_meters', sa.Integer(), nullable=True, server_default='1000'),
        sa.Column('preferred_gender', sa.String(), nullable=True),
        sa.Column('preferred_language', sa.String(), nullable=True),
        sa.Column('minimum_driver_rating', sa.Float(), nullable=True, server_default='4.0'),
        sa.Column('prefer_same_enterprise', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('prefer_same_destination', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('prefer_recurring_rides', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Create ride_match_history table
    op.create_table(
        'ride_match_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('matched_user_id', sa.Integer(), nullable=False),
        sa.Column('ride_id', sa.Integer(), nullable=False),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('match_reason', sa.String(), nullable=True),
        sa.Column('was_accepted', sa.Boolean(), nullable=True),
        sa.Column('feedback_rating', sa.Integer(), nullable=True),
        sa.Column('feedback_comment', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['matched_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'matched_user_id', 'ride_id')
    )
    op.create_index(op.f('ix_ride_match_history_id'), 'ride_match_history', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_ride_match_history_id'), table_name='ride_match_history')
    op.drop_table('ride_match_history')
    op.drop_table('user_matching_preferences')
    op.drop_index(op.f('ix_user_travel_patterns_user_id'), table_name='user_travel_patterns')
    op.drop_index(op.f('ix_user_travel_patterns_id'), table_name='user_travel_patterns')
    op.drop_table('user_travel_patterns')
    
    # Drop foreign key constraints
    op.drop_constraint('fk_users_preferred_vehicle_type', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_preferred_hub', 'users', type_='foreignkey')
    
    # Drop columns from users table
    op.drop_column('users', 'max_wait_minutes')
    op.drop_column('users', 'max_detour_minutes')
    op.drop_column('users', 'max_walking_distance_meters')
    op.drop_column('users', 'preferred_vehicle_type_id')
    op.drop_column('users', 'preferred_starting_hub_id')
