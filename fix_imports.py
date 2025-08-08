#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_imports_in_file(filepath):
    """Fix imports in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Fix @shared imports
    content = re.sub(r'from "@shared/components/([^"]+)"', r'from "../components/\1"', content)
    content = re.sub(r'from "@shared/services/([^"]+)"', r'from "../services/\1"', content)
    content = re.sub(r'from "@shared/types"', r'from "../types"', content)
    content = re.sub(r'from "@shared/types/([^"]+)"', r'from "../types/\1"', content)
    content = re.sub(r'from "@shared/utils/([^"]+)"', r'from "../utils/\1"', content)
    content = re.sub(r'from "@shared/contexts/([^"]+)"', r'from "../contexts/\1"', content)
    content = re.sub(r'from "@shared/styles/([^"]+)"', r'from "../styles/\1"', content)
    
    # Fix @frontend imports
    content = re.sub(r'from "@frontend/components/([^"]+)"', r'from "../components/\1"', content)
    content = re.sub(r'from "@frontend/types"', r'from "../types"', content)
    content = re.sub(r'from "@frontend/services/([^"]+)"', r'from "../services/\1"', content)
    content = re.sub(r'from "@frontend/([^"]+)"', r'from "../\1"', content)
    
    # Fix imports in specific directories
    file_path = Path(filepath)
    
    # For files in app directory (need to go up one level)
    if 'app/' in str(file_path):
        if 'app/campaigns/[name]' in str(file_path):
            # Three levels deep
            content = re.sub(r'from "\.\./components/', r'from "../../../components/', content)
            content = re.sub(r'from "\.\./services/', r'from "../../../services/', content)
            content = re.sub(r'from "\.\./types', r'from "../../../types', content)
            content = re.sub(r'from "\.\./utils/', r'from "../../../utils/', content)
            content = re.sub(r'from "\.\./contexts/', r'from "../../../contexts/', content)
        else:
            # Two levels deep
            content = re.sub(r'from "\.\./components/', r'from "../../components/', content)
            content = re.sub(r'from "\.\./services/', r'from "../../services/', content)
            content = re.sub(r'from "\.\./types', r'from "../../types', content)
            content = re.sub(r'from "\.\./utils/', r'from "../../utils/', content)
            content = re.sub(r'from "\.\./contexts/', r'from "../../contexts/', content)
    
    # For components referring to other components
    if 'components/' in str(file_path):
        content = re.sub(r'from "\.\./components/', r'from "./', content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated: {filepath}")
        return True
    return False

def main():
    frontend_dir = Path('frontend')
    
    total_updated = 0
    for ext in ['*.ts', '*.tsx', '*.js', '*.jsx']:
        for filepath in frontend_dir.rglob(ext):
            if 'node_modules' not in str(filepath) and '.next' not in str(filepath):
                if fix_imports_in_file(filepath):
                    total_updated += 1
    
    print(f"\nTotal files updated: {total_updated}")

if __name__ == "__main__":
    main()