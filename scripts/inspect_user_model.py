#!/usr/bin/env python
"""
This script inspects the User model to identify its attributes.
Run this script to debug the User model structure.
"""
import os
import sys

from sqlalchemy import inspect as sa_inspect

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.db.session import SessionLocal
    from app.models.user import User

    print("\n----- User Model Inspection -----\n")

    # Inspect the class attributes
    print("Class attributes:")
    user_class_attrs = [attr for attr in dir(User) if not attr.startswith("_")]
    for attr in user_class_attrs:
        print(f"  - {attr}")

    # Create a test instance
    test_user = User()

    print("\nInstance attributes:")
    user_instance_attrs = [attr for attr in dir(test_user) if not attr.startswith("_")]
    for attr in user_instance_attrs:
        print(f"  - {attr}")

    # Get SQLAlchemy columns
    print("\nSQLAlchemy columns:")
    mapper = sa_inspect(User)
    for column in mapper.columns:
        print(f"  - {column.key}: {column.type}")

    # Try to get a user from the database
    print("\nTrying to fetch a user from the database:")
    try:
        db = SessionLocal()
        db_user = db.query(User).first()
        if db_user:
            print("  Found a user in the database!")
            print("  User attributes:")
            for attr in dir(db_user):
                if not attr.startswith("_"):
                    value = getattr(db_user, attr)
                    if not callable(value):
                        print(f"    - {attr}: {value}")
        else:
            print("  No users found in the database.")
    except Exception as e:
        print(f"  Error accessing database: {e}")
    finally:
        db.close()

    print("\n----- End of Inspection -----\n")

except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Error: {e}")
