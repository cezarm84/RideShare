"""
Script to fix the ride with ID 2 that has a missing destination_hub_id.
Run this script directly to update the database.
"""

import sys
from pathlib import Path

# Add the parent directory to sys.path to import app modules
script_dir = Path(__file__).resolve().parent
app_dir = script_dir.parent
sys.path.append(str(app_dir))


# Import the session first before any models
from app.db.session import SessionLocal


def fix_ride_destination(ride_id=2):
    """Fix the ride with the given ID by setting a valid destination hub."""
    db = SessionLocal()

    try:
        # Get the ride using raw SQL to avoid model conflicts
        # This avoids the need to import the Ride model which might trigger the error
        ride = db.execute(f"SELECT * FROM rides WHERE id = {ride_id}").fetchone()

        if not ride:
            print(f"Ride with ID {ride_id} not found!")
            return False

        print(f"Found ride: {ride}")
        print(f"Current starting hub ID: {ride.starting_hub_id}")
        print(f"Current destination hub ID: {ride.destination_hub_id}")

        # If destination is already set, no need to fix
        if ride.destination_hub_id is not None:
            print("Ride already has a destination hub set. No fix needed.")
            return True

        # Get starting hub information
        starting_hub = db.execute(
            f"SELECT * FROM hubs WHERE id = {ride.starting_hub_id}"
        ).fetchone()
        if not starting_hub:
            print(f"Starting hub with ID {ride.starting_hub_id} not found!")
            return False

        print(f"Starting hub: {starting_hub.name} (ID: {starting_hub.id})")

        # Get all available hubs to choose a destination
        hubs = db.execute(
            "SELECT * FROM hubs WHERE id != :starting_hub_id",
            {"starting_hub_id": ride.starting_hub_id},
        ).fetchall()

        if not hubs:
            print("No alternative hubs found in the database!")

            # Create a new hub without importing the Hub model
            print("Creating a new hub as destination...")
            db.execute(
                """
                INSERT INTO hubs (name, address, city, postal_code,
                                 latitude, longitude, is_active)
                VALUES ('Hub Downtown', 'Main Street 123',
                       'Downtown', '12345', 59.3293, 18.0686, 1)
            """
            )
            db.commit()

            # Get the ID of the newly created hub
            new_hub = db.execute(
                "SELECT * FROM hubs ORDER BY id DESC LIMIT 1"
            ).fetchone()
            destination_hub_id = new_hub.id
            print(f"Created new hub with ID {destination_hub_id}")
        else:
            # Use the first available hub as destination
            destination_hub_id = hubs[0].id
            print(f"Selected existing hub with ID {destination_hub_id} as destination")

        # Update the ride with the destination hub
        db.execute(
            """
            UPDATE rides
            SET destination_hub_id = :destination_hub_id,
                destination_lat = :destination_lat,
                destination_lng = :destination_lng
            WHERE id = :ride_id
        """,
            {
                "destination_hub_id": destination_hub_id,
                "destination_lat": 59.3293,  # Example coordinates
                "destination_lng": 18.0686,
                "ride_id": ride_id,
            },
        )

        db.commit()
        print(
            f"Successfully updated ride {ride_id} with destination hub ID {destination_hub_id}"
        )

        # Verify the update
        updated_ride = db.execute(
            f"SELECT * FROM rides WHERE id = {ride_id}"
        ).fetchone()
        print(f"Verification - Starting hub ID: {updated_ride.starting_hub_id}")
        print(f"Verification - Destination hub ID: {updated_ride.destination_hub_id}")

        return True
    except Exception as e:
        db.rollback()
        print(f"Error fixing ride destination: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting script to fix ride destination...")

    # Check if a specific ride ID was provided
    ride_id = 2
    if len(sys.argv) > 1:
        try:
            ride_id = int(sys.argv[1])
        except ValueError:
            print(f"Invalid ride ID: {sys.argv[1]}. Using default: 2")

    success = fix_ride_destination(ride_id)

    if success:
        print("✅ Fix completed successfully!")
    else:
        print("❌ Failed to fix the ride.")
