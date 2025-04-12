#!/usr/bin/env python
"""
Script to create an admin user in the RideShare application
"""
import sys
from pathlib import Path

# Add the parent directory to sys.path so Python can find the app module
parent_dir = str(Path(__file__).parent.parent)
sys.path.append(parent_dir)

import logging

from sqlalchemy import text

from app.core.security import get_password_hash

# Now we can import app modules
from app.db.session import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_admin_user(email, password, first_name, last_name):
    """Create an admin user with the given credentials"""
    logger.info(f"Creating admin user: {email}")

    try:
        # Get database session
        db = next(get_db())

        # Check if user already exists
        check_query = text('SELECT 1 FROM "user" WHERE email = :email')
        result = db.execute(check_query, {"email": email}).fetchone()

        # Hash the password
        hashed_password = get_password_hash(password)

        if result:
            # Update existing user
            logger.info(f"User {email} already exists, updating to admin privileges")
            update_query = text(
                """
                UPDATE "user"
                SET password_hash = :password_hash,
                    first_name = :first_name,
                    last_name = :last_name,
                    user_type = 'admin',
                    is_active = TRUE
                WHERE email = :email
            """
            )

            db.execute(
                update_query,
                {
                    "email": email,
                    "password_hash": hashed_password,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
        else:
            # Create new user
            logger.info(f"Creating new admin user: {email}")
            insert_query = text(
                """
                INSERT INTO "user" (
                    email, password_hash, first_name, last_name,
                    phone_number, user_type, is_active
                ) VALUES (
                    :email, :password_hash, :first_name, :last_name,
                    '0000000000', 'admin', TRUE
                )
            """
            )

            db.execute(
                insert_query,
                {
                    "email": email,
                    "password_hash": hashed_password,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )

        # Commit the transaction
        db.commit()
        logger.info(f"Admin user {email} created/updated successfully")
        return True

    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        return False


if __name__ == "__main__":
    import argparse

    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(
        description="Create an admin user for the RideShare application"
    )
    parser.add_argument(
        "--email", default="admin@rideshare.com", help="Admin email address"
    )
    parser.add_argument("--password", default="adminpassword", help="Admin password")
    parser.add_argument("--first-name", default="Admin", help="Admin first name")
    parser.add_argument("--last-name", default="User", help="Admin last name")

    args = parser.parse_args()

    # Create the admin user
    success = create_admin_user(
        args.email, args.password, args.first_name, args.last_name
    )

    if success:
        print("\nAdmin user created successfully!")
        print("Login with:")
        print(f"  Email: {args.email}")
        print(f"  Password: {args.password}\n")
    else:
        print("\nFailed to create admin user. Check the logs for details.\n")
        sys.exit(1)
