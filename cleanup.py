import os
import shutil
import re
from pathlib import Path

# Define the root directory
root_dir = Path('.')

# Define the temp directory
temp_dir = root_dir / 'temp'

# Create temp directory if it doesn't exist
if not temp_dir.exists():
    temp_dir.mkdir(parents=True)

# Define patterns for unnecessary files
unnecessary_patterns = [
    r'.*\.log$',
    r'.*\.tmp$',
    r'.*\.bak$',
    r'.*\.swp$',
    r'.*\.swo$',
    r'.*~$',
    r'Thumbs\.db$',
    r'\.DS_Store$',
    r'npm-debug\.log.*$',
    r'yarn-debug\.log.*$',
    r'yarn-error\.log.*$',
]

# Compile the patterns
compiled_patterns = [re.compile(pattern) for pattern in unnecessary_patterns]

# Define directories to exclude
exclude_dirs = [
    '.git',
    'node_modules',
    'venv',
    '.venv',
    'env',
    'ENV',
    'temp',
    '__pycache__'
]

# Function to check if a file matches any of the patterns
def is_unnecessary_file(file_path):
    file_name = file_path.name
    return any(pattern.match(file_name) for pattern in compiled_patterns)

# Function to check if a directory should be excluded
def should_exclude_dir(dir_path):
    return any(exclude_dir in str(dir_path) for exclude_dir in exclude_dirs)

# Find and move unnecessary files
def cleanup_files():
    moved_files = []
    
    for file_path in root_dir.glob('**/*'):
        if file_path.is_file() and is_unnecessary_file(file_path):
            # Check if the file is in an excluded directory
            if not should_exclude_dir(file_path.parent):
                # Create the relative path structure in the temp directory
                rel_path = file_path.relative_to(root_dir)
                target_path = temp_dir / rel_path
                
                # Create parent directories if they don't exist
                target_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Move the file
                try:
                    shutil.move(str(file_path), str(target_path))
                    moved_files.append(str(rel_path))
                    print(f"Moved: {rel_path}")
                except Exception as e:
                    print(f"Error moving {rel_path}: {str(e)}")
    
    return moved_files

# Run the cleanup
if __name__ == "__main__":
    print("Starting cleanup...")
    moved_files = cleanup_files()
    
    if moved_files:
        print(f"\nMoved {len(moved_files)} unnecessary files to the temp directory:")
        for file in moved_files:
            print(f"  - {file}")
    else:
        print("\nNo unnecessary files found.")
    
    print("\nCleanup complete!")
