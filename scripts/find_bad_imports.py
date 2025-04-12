import os
import re
from pathlib import Path


def find_bad_imports(root_dir):
    """Find all Python files that import Hub from location.py"""
    pattern = r"from\s+app\.models\.location\s+import\s+.*Hub"
    found_files = []

    for root, dirs, files in os.walk(root_dir):
        # Skip virtual environment directories
        if "venv" in dirs:
            dirs.remove("venv")
        if "__pycache__" in dirs:
            dirs.remove("__pycache__")

        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        if re.search(pattern, content):
                            found_files.append(file_path)
                            line_num = 1
                            for line in content.split("\n"):
                                if re.search(pattern, line):
                                    print(
                                        f"{file_path} (line {line_num}): {line.strip()}"
                                    )
                                line_num += 1
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    if not found_files:
        print("No problematic imports found!")
    else:
        print(f"\nFound {len(found_files)} file(s) with bad imports.")
        print("Fix each file to import Hub from app.models.hub instead.")

    return found_files


if __name__ == "__main__":
    root_dir = str(Path(__file__).resolve().parent.parent)
    print(f"Searching for bad imports in {root_dir}...")
    find_bad_imports(root_dir)
