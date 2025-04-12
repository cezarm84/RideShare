"""
Migration script to add the role field to the users table.
"""

import logging
import os
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database path
DB_PATH = os.path.join(os.getcwd(), "rideshare.db")


def run_migration():
    """
    Add the role field to the users table and set default values based on existing data.
    """
    logger.info(f"Running migration on database at {DB_PATH}")

    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if the role column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]

        if "role" not in column_names:
            logger.info("Adding 'role' column to users table")
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")

            # Update roles based on existing data
            logger.info("Updating roles based on existing user types")

            # Set admin roles
            cursor.execute("UPDATE users SET role = 'admin' WHERE user_type = 'admin'")

            # Set superadmin roles
            cursor.execute(
                "UPDATE users SET role = 'superadmin' WHERE is_superadmin = 1"
            )

            # Set driver roles
            cursor.execute(
                "UPDATE users SET role = 'driver' WHERE user_type = 'driver'"
            )

            # Set manager roles for business users (example rule)
            cursor.execute(
                "UPDATE users SET role = 'manager' WHERE user_type = 'business'"
            )

            # Commit the changes
            conn.commit()
            logger.info("Migration completed successfully")
        else:
            logger.info("The 'role' column already exists in the users table")

    except Exception as e:
        conn.rollback()
        logger.error(f"Error during migration: {str(e)}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()
