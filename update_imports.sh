#!/bin/bash

echo "Updating import paths from @shared to relative paths..."

# Function to update imports in a file
update_imports() {
    local file=$1
    echo "Updating: $file"
    
    # Update @shared imports to relative paths
    sed -i '' 's|from "@shared/components/|from "./|g' "$file"
    sed -i '' 's|from "@shared/services/|from "../services/|g' "$file"
    sed -i '' 's|from "@shared/types|from "../types|g' "$file"
    sed -i '' 's|from "@shared/utils/|from "../utils/|g' "$file"
    sed -i '' 's|from "@shared/contexts/|from "../contexts/|g' "$file"
    sed -i '' 's|from "@shared/styles/|from "../styles/|g' "$file"
    
    # Update @frontend imports 
    sed -i '' 's|from "@frontend/components/|from "../components/|g' "$file"
    sed -i '' 's|from "@frontend/types|from "../types|g' "$file"
    sed -i '' 's|from "@frontend/services/|from "../services/|g' "$file"
    sed -i '' 's|from "@frontend/|from "../|g' "$file"
    
    # Update imports in app directory files (different relative path)
    if [[ $file == *"/app/"* ]]; then
        sed -i '' 's|from "\.\./|from "../|g' "$file"
        sed -i '' 's|from "@shared/components/|from "../components/|g' "$file"
        sed -i '' 's|from "@shared/services/|from "../services/|g' "$file"
        sed -i '' 's|from "@shared/types|from "../types|g' "$file"
        sed -i '' 's|from "@shared/utils/|from "../utils/|g' "$file"
        sed -i '' 's|from "@shared/contexts/|from "../contexts/|g' "$file"
    fi
    
    # Update imports in components directory
    if [[ $file == *"/components/"* ]]; then
        sed -i '' 's|from "@shared/types|from "../types|g' "$file"
        sed -i '' 's|from "@shared/services/|from "../services/|g' "$file"
        sed -i '' 's|from "@shared/utils/|from "../utils/|g' "$file"
    fi
}

# Find all TypeScript/JavaScript files in frontend directory
find frontend -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    update_imports "$file"
done

echo "Import paths updated successfully!"