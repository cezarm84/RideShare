import os
import re
from pathlib import Path

def scan_for_issues(root_dir):
    """Scan all Python files for potential import issues"""
    hub_import_pattern = r'from\s+app\.models\.location\s+import\s+.*Hub'
    relationship_issues = ['user', 'passenger', 'back_populates', 'backref']
    
    hub_issues = []
    rel_issues = []
    
    for root, dirs, files in os.walk(root_dir):
        # Skip virtual environment directories
        if "venv" in dirs:
            dirs.remove("venv")
        if "__pycache__" in dirs:
            dirs.remove("__pycache__")
            
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Check for Hub import issues
                        if re.search(hub_import_pattern, content):
                            hub_issues.append(file_path)
                            line_num = 1
                            for line in content.split('\n'):
                                if re.search(hub_import_pattern, line):
                                    print(f"HUB IMPORT ISSUE: {file_path} (line {line_num}): {line.strip()}")
                                line_num += 1
                        
                        # Look for potential relationship issues
                        if 'relationship' in content:
                            for term in relationship_issues:
                                if term in content:
                                    rel_issues.append(file_path)
                                    print(f"POTENTIAL RELATIONSHIP ISSUE: {file_path} (contains '{term}')")
                                    break
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    print("\n--- SUMMARY ---")
    if not hub_issues:
        print("No Hub import issues found!")
    else:
        print(f"Found {len(hub_issues)} file(s) with Hub import issues.")
        print("Fix each file to import Hub from app.models.hub instead.")
    
    if rel_issues:
        print(f"Found {len(rel_issues)} file(s) with potential relationship issues.")
        print("Check these files for user/passenger relationship definitions.")
    
    return hub_issues, rel_issues

if __name__ == "__main__":
    root_dir = str(Path(__file__).resolve().parent.parent)
    print(f"Scanning for issues in {root_dir}...")
    scan_for_issues(root_dir)
    print("\nScan complete!")