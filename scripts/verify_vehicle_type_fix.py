#!/usr/bin/env python
"""
Script to verify that the vehicle_type_id column is working properly.
Creates a test ride with a vehicle_type_id and verifies it can be retrieved.
"""
import datetime
import os
import sqlite3
import sys
from pathlib import Path

# Add the parent directory to the path
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))


def verify_vehicle_type_fix():
    """Test that the vehicle_type_id column is working properly."""
    try:
        # Connect to the database
        db_path = os.path.join(parent_dir, "rideshare.db")
        if not os.path.exists(db_path):
            print(f"Error: Database file not found at {db_path}")
            return False

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # First, check if the rides table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='rides';"
        )
        if not cursor.fetchone():
            print("Error: The rides table does not exist in the database.")
            return False

        # Check if the vehicle_type_id column exists
        cursor.execute("PRAGMA table_info(rides)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if "vehicle_type_id" not in column_names:
            print(
                "Error: The vehicle_type_id column does not exist in the rides table."
            )
            return False

        print("✅ The rides table exists with the vehicle_type_id column.")

        # Get a vehicle_type_id to use
        cursor.execute("SELECT id FROM vehicle_types LIMIT 1")
        vehicle_type_result = cursor.fetchone()

        if not vehicle_type_result:
            print("Creating a vehicle type since none exists...")
            cursor.execute(
                "INSERT INTO vehicle_types (name, description, max_passengers) VALUES (?, ?, ?)",
                ("Test Vehicle", "Test vehicle type", 4),
            )
            conn.commit()
            vehicle_type_id = cursor.lastrowid
        else:
            vehicle_type_id = vehicle_type_result[0]

        # Get a user_id to use
        cursor.execute("SELECT id FROM users LIMIT 1")
        user_result = cursor.fetchone()

        if not user_result:
            print("Creating a user since none exists...")
            cursor.execute(
                "INSERT INTO users (email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?)",
                ("test@example.com", "Test", "User", "password_hash"),
            )
            conn.commit()
            user_id = cursor.lastrowid
        else:
            user_id = user_result[0]

        # Create a test ride with a vehicle_type_id
        print(f"Creating a test ride with vehicle_type_id = {vehicle_type_id}...")

        departure_time = datetime.datetime.now() + datetime.timedelta(days=1)
        departure_time_str = departure_time.strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute(
            """
            INSERT INTO rides (
                driver_id, origin_lat, origin_lng, destination_lat, destination_lng,
                departure_time, available_seats, price_per_seat, vehicle_type_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                user_id,
                40.7128,
                -74.0060,
                34.0522,
                -118.2437,
                departure_time_str,
                3,
                25.50,
                vehicle_type_id,
            ),
        )
        conn.commit()
        ride_id = cursor.lastrowid

        # Retrieve the ride to verify the vehicle_type_id was stored correctly
        cursor.execute(
            """
            SELECT id, driver_id, departure_time, available_seats, price_per_seat, vehicle_type_id
            FROM rides WHERE id = ?
        """,
            (ride_id,),
        )

        ride = cursor.fetchone()

        if not ride:
            print(f"Error: Could not retrieve the created ride with ID {ride_id}")
            return False

        print("\nRetrieved ride:")
        print(f"  ID: {ride[0]}")
        print(f"  Driver ID: {ride[1]}")
        print(f"  Departure Time: {ride[2]}")
        print(f"  Available Seats: {ride[3]}")
        print(f"  Price Per Seat: {ride[4]}")
        print(f"  Vehicle Type ID: {ride[5]}")

        if ride[5] == vehicle_type_id:
            print(
                "\n✅ Success! The vehicle_type_id was properly stored and retrieved."
            )
            print("The issue has been fixed.")
        else:
            print(
                f"\n❌ Error: The retrieved vehicle_type_id ({ride[5]}) does not match the original ({vehicle_type_id})."
            )
            return False

        conn.close()
        return True
    except Exception as e:
        print(f"Error verifying fix: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=== Verifying Vehicle Type ID Fix ===\n")
    verify_vehicle_type_fix()
