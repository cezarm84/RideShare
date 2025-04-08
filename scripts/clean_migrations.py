#!/usr/bin/env python
"""
Script to clean up migration files and resolve conflicts.
"""
import os
import shutil
from pathlib import Path
import re

def clean_migrations():
    """Clean up migration files by removing duplicates and resolving conflicts."""
    try:
        # Get the path to the migrations directory
        parent_dir = Path(__file__).parent.parent
        versions_dir = os.path.join(parent_dir, 'migrations', 'versions')
        backup_dir = os.path.join(parent_dir, 'migrations', 'backup_versions')
        
        # Create backup directory if it doesn't exist
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        print(f"Backing up migration files to: {backup_dir}")
        
        # Backup all existing migration files
        for filename in os.listdir(versions_dir):
            if filename.endswith('.py'):
                src_path = os.path.join(versions_dir, filename)
                dst_path = os.path.join(backup_dir, filename)
                shutil.copy2(src_path, dst_path)
        
        # Get list of all migration files
        migration_files = []
        for filename in os.listdir(versions_dir):
            if filename.endswith('.py') and not filename.startswith('__'):
                migration_files.append(filename)
        
        # Check for duplicate revisions
        revision_ids = {}
        for filename in migration_files:
            # Extract revision ID from filename if possible
            match = re.match(r'([0-9a-f]+)_.*\.py', filename)
            if match:
                rev_id = match.group(1)
                if rev_id in revision_ids:
                    print(f"Duplicate revision ID found: {rev_id}")
                    print(f"  File 1: {revision_ids[rev_id]}")
                    print(f"  File 2: {filename}")
                    # Keep the first file, move the second to duplicates
                    shutil.move(
                        os.path.join(versions_dir, filename),
                        os.path.join(backup_dir, f"duplicate_{filename}")
                    )
                    print(f"  Moved {filename} to backup directory as duplicate.")
                else:
                    revision_ids[rev_id] = filename
        
        # Remove the merged migration as it's causing conflicts
        merged_file = '21f37aff74c9_merge_three_heads.py'
        if os.path.exists(os.path.join(versions_dir, merged_file)):
            shutil.move(
                os.path.join(versions_dir, merged_file),
                os.path.join(backup_dir, merged_file)
            )
            print(f"Moved conflicting merge migration {merged_file} to backup directory.")
        
        # Check for and remove add_vehicle_type_to_rides.py if needed since it's duplicating 2f8c936ae712
        if os.path.exists(os.path.join(versions_dir, 'add_vehicle_type_to_rides.py')):
            shutil.move(
                os.path.join(versions_dir, 'add_vehicle_type_to_rides.py'),
                os.path.join(backup_dir, 'add_vehicle_type_to_rides.py')
            )
            print("Moved duplicate add_vehicle_type_to_rides.py to backup directory.")
        
        print("\nMigration files cleaned up.")
        print("You should now be able to run migrations with 'alembic upgrade head'.")
        
        return True
    except Exception as e:
        print(f"Error cleaning up migrations: {e}")
        return False

if __name__ == "__main__":
    clean_migrations()