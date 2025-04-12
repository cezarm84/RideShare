#!/bin/bash
# Script to merge multiple Alembic migration heads

# Display current heads
echo "Current migration heads:"
alembic heads

# Get the revision identifiers
echo ""
echo "Please enter the head revisions from above, separated by spaces:"
read -p "> " heads

# Create merge migration
echo ""
echo "Creating merge migration..."
alembic merge -m "merge multiple heads" $heads

# Upgrade to the new merged head
echo ""
echo "Upgrading to the new merged head..."
alembic upgrade heads

echo ""
echo "Migration merge complete!"
