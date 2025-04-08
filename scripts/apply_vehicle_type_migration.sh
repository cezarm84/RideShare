#!/bin/bash
# Script to apply database migrations and set up vehicle types

# Navigate to project root
cd "$(dirname "$0")/.."

echo "Applying database migrations..."
alembic upgrade head

echo "Creating standard vehicle types..."
python scripts/create_vehicle_types.py

echo "Migration completed successfully!"