#!/usr/bin/env python
"""
Script to thoroughly clean up migration files and fix all issues.
"""
import datetime
import glob
import os
import shutil
from pathlib import Path


def thorough_migration_cleanup():
    """Thoroughly clean up migration files to resolve all conflicts."""
    try:
        # Get the path to the migrations directory
        parent_dir = Path(__file__).parent.parent
        versions_dir = os.path.join(parent_dir, "migrations", "versions")
        backup_dir = os.path.join(parent_dir, "migrations", "backup_versions")

        # Create backup directory if it doesn't exist
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        print(f"Backing up all migration files to: {backup_dir}")
        timestamp = int(datetime.datetime.now().timestamp())
        backup_subdir = os.path.join(backup_dir, f"backup_{timestamp}")
        os.makedirs(backup_subdir, exist_ok=True)

        # Backup all existing migration files
        for filename in os.listdir(versions_dir):
            if filename.endswith(".py"):
                src_path = os.path.join(versions_dir, filename)
                dst_path = os.path.join(backup_subdir, filename)
                shutil.copy2(src_path, dst_path)

        print(f"All migration files backed up to: {backup_subdir}")

        # Find all duplicate files of 2f8c936ae712
        duplicate_files = []
        for filename in os.listdir(versions_dir):
            if filename.endswith(".py"):
                with open(
                    os.path.join(versions_dir, filename),
                    "r",
                    encoding="utf-8",
                    errors="ignore",
                ) as f:
                    content = f.read()
                    # Check if this file contains the duplicate revision ID
                    if (
                        "revision: str = '2f8c936ae712'" in content
                        or "revision = '2f8c936ae712'" in content
                    ):
                        duplicate_files.append(filename)

        print(f"Found {len(duplicate_files)} file(s) with revision ID 2f8c936ae712:")
        for filename in duplicate_files:
            print(f"  - {filename}")

        # Keep only one copy of 2f8c936ae712
        if len(duplicate_files) > 1:
            # Keep the first one, move others to backup
            keeper = duplicate_files[0]
            print(f"Keeping {keeper} and moving others to backup")

            for filename in duplicate_files[1:]:
                src_path = os.path.join(versions_dir, filename)
                dst_path = os.path.join(backup_dir, f"duplicate_{filename}")
                shutil.move(src_path, dst_path)
                print(f"  Moved {filename} to {dst_path}")

        # Handle the add_vehicle_type_to_rides.py file if it exists
        vehicle_type_file = os.path.join(versions_dir, "add_vehicle_type_to_rides.py")
        if os.path.exists(vehicle_type_file):
            dst_path = os.path.join(backup_dir, "add_vehicle_type_to_rides.py")
            shutil.move(vehicle_type_file, dst_path)
            print("Moved add_vehicle_type_to_rides.py to backup")

        # Handle any merge migration files
        merge_files = glob.glob(os.path.join(versions_dir, "*merge*.py"))
        for merge_file in merge_files:
            filename = os.path.basename(merge_file)
            dst_path = os.path.join(backup_dir, filename)
            shutil.move(merge_file, dst_path)
            print(f"Moved merge migration {filename} to backup")

        print("\nMigration directory cleaned up successfully!")
        print("You should now be able to create and apply migrations properly.")

        return True
    except Exception as e:
        print(f"Error cleaning up migrations: {e}")
        print(f"Exception details: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    thorough_migration_cleanup()
