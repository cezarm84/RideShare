"""
update payments table for new payment methods

Revision ID: eb25ad6dcc0d
Revises: eb25ad6dcc0d
Create Date: 2025-04-10T00:45:57.156094

"""



from alembic import op

# revision identifiers, used by Alembic.
revision = "eb25ad6dcc0d"
down_revision = "eb25ad6dcc0d"
branch_labels = None
depends_on = None


def upgrade():
    # Table already updated directly in the database
    pass


def downgrade():
    # Drop new columns if needed
    op.drop_index("ix_payments_payment_method_id", table_name="payments")
    with op.batch_alter_table("payments") as batch_op:
        batch_op.drop_column("payment_method_id")
        batch_op.drop_column("payment_provider")
        batch_op.drop_column("payment_type")
        batch_op.drop_column("payment_details")
