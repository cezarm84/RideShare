#!/usr/bin/env python
"""
Script to directly initialize the database with all necessary tables,
ensuring the rides table has the vehicle_type_id column that was missing.

This bypasses Alembic migrations completely to create a working database.
"""
import os
import sys
import sqlite3
from pathlib import Path
import datetime

# Add the parent directory to the path
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

def direct_db_init():
    """Directly initialize the database with all necessary tables."""
    try:
        # Delete the existing database if it exists
        db_path = os.path.join(parent_dir, 'rideshare.db')
        if os.path.exists(db_path):
            print(f"Removing existing database: {db_path}")
            os.remove(db_path)
        
        # Create a new empty database
        print("Creating new database...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create alembic_version table and stamp with a valid revision
        print("Creating alembic_version table...")
        cursor.execute('''
        CREATE TABLE alembic_version (
            version_num VARCHAR(32) NOT NULL,
            PRIMARY KEY (version_num)
        )
        ''')
        
        # Insert a valid revision ID that exists in your migration history
        # Using the one that was reported by the check script
        cursor.execute("INSERT INTO alembic_version (version_num) VALUES (?)", ('2f8c936ae712',))
        
        # Create the rides table with vehicle_type_id column
        print("Creating rides table with vehicle_type_id column...")
        cursor.execute('''
        CREATE TABLE rides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            origin_lat FLOAT,
            origin_lng FLOAT,
            destination_lat FLOAT,
            destination_lng FLOAT,
            starting_hub_id INTEGER,
            destination_hub_id INTEGER,
            origin_location_id INTEGER,
            destination_location_id INTEGER,
            departure_time TIMESTAMP NOT NULL,
            arrival_time TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
            available_seats INTEGER NOT NULL,
            price_per_seat FLOAT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            vehicle_type_id INTEGER
        )
        ''')
        
        # Create other necessary tables (simplified versions)
        print("Creating other necessary tables...")
        
        # Users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(36) UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone_number VARCHAR(20),
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            is_verified BOOLEAN NOT NULL DEFAULT 0,
            is_superadmin BOOLEAN NOT NULL DEFAULT 0,
            user_type VARCHAR(20) NOT NULL DEFAULT 'regular',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            home_address VARCHAR(255),
            work_address VARCHAR(255),
            latitude FLOAT,
            longitude FLOAT,
            work_latitude FLOAT,
            work_longitude FLOAT,
            home_location VARCHAR(255),
            work_location VARCHAR(255),
            enterprise_id INTEGER,
            employee_id VARCHAR(100),
            home_street VARCHAR(255),
            home_house_number VARCHAR(20),
            home_post_code VARCHAR(20),
            home_city VARCHAR(100),
            work_street VARCHAR(255),
            work_house_number VARCHAR(20),
            work_post_code VARCHAR(20),
            work_city VARCHAR(100)
        )
        ''')
        
        # Ride bookings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ride_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ride_id INTEGER NOT NULL,
            passenger_id INTEGER NOT NULL,
            seats_booked INTEGER NOT NULL DEFAULT 1,
            booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            pickup_lat FLOAT,
            pickup_lng FLOAT,
            dropoff_lat FLOAT,
            dropoff_lng FLOAT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ride_id) REFERENCES rides(id),
            FOREIGN KEY (passenger_id) REFERENCES users(id)
        )
        ''')
        
        # Hubs table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS hubs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            address VARCHAR(255) NOT NULL,
            city VARCHAR(100) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
        ''')
        
        # Locations table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            location_type VARCHAR(50) NOT NULL,
            address VARCHAR(255),
            city VARCHAR(100),
            postal_code VARCHAR(20),
            name VARCHAR(100),
            description TEXT,
            is_favorite BOOLEAN NOT NULL DEFAULT 0,
            enterprise_id INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        # Additional tables based on the errors in migration scripts
        
        # Messages table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER,
            content TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (recipient_id) REFERENCES users(id)
        )
        ''')
        
        # Message attachments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS message_attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_type VARCHAR(100),
            file_size INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id)
        )
        ''')
        
        # Vehicle types table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicle_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            max_passengers INTEGER NOT NULL,
            icon_url VARCHAR(255),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
        ''')
        
        # Insert some sample data
        print("Inserting sample data...")
        
        # Sample vehicle types
        vehicle_types = [
            ("Sedan", "Standard 4-door car", 4, None),
            ("SUV", "Sport utility vehicle with extra space", 6, None),
            ("Van", "Larger vehicle for groups", 8, None)
        ]
        
        cursor.executemany(
            "INSERT INTO vehicle_types (name, description, max_passengers, icon_url) VALUES (?, ?, ?, ?)",
            vehicle_types
        )
        
        # Sample user
        current_time = datetime.datetime.now().isoformat()
        password_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # "password"
        
        cursor.execute(
            "INSERT INTO users (email, first_name, last_name, password_hash, is_active, is_verified, created_at, is_superadmin) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("admin@example.com", "Admin", "User", password_hash, 1, 1, current_time, 1)
        )
        
        # Commit and close
        conn.commit()
        conn.close()
        
        print(f"Database successfully initialized at: {db_path}")
        print("The rides table has been created with the vehicle_type_id column.")
        print("\nVerification:")
        verify_database(db_path)
        
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_database(db_path):
    """Verify that the database was created correctly with all the necessary tables."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"Created tables: {', '.join(tables)}")
        
        # Verify the rides table has vehicle_type_id
        cursor.execute("PRAGMA table_info(rides)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print("\nRides table columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        if "vehicle_type_id" in column_names:
            print("\n✅ vehicle_type_id column exists in the rides table!")
        else:
            print("\n❌ vehicle_type_id column is MISSING from the rides table!")
        
        # Check alembic version
        cursor.execute("SELECT version_num FROM alembic_version")
        version = cursor.fetchone()
        print(f"\nAlembic version: {version[0]}")
        
        conn.close()
    except Exception as e:
        print(f"Error verifying database: {e}")

if __name__ == "__main__":
    print("=== Direct Database Initialization ===")
    direct_db_init()
