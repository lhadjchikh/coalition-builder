#!/bin/bash

# Setup script for local development
# Creates symlinks in ssr directory for Jest compatibility

set -e

echo "Setting up local development environment..."

# Navigate to ssr directory
cd "$(dirname "$0")/../ssr"

# Remove existing directories/symlinks if they exist
echo "Removing existing frontend and shared directories..."
rm -rf frontend shared 2>/dev/null || true

# Create symlinks
echo "Creating symlinks..."
ln -sf ../frontend ./frontend
ln -sf ../shared ./shared

# Verify symlinks were created
if [ -L "frontend" ] && [ -L "shared" ]; then
  echo "✅ Symlinks created successfully:"
  ls -la frontend shared
  echo ""
  echo "Local development environment is ready!"
  echo "You can now run Jest tests and Next.js development server."
else
  echo "❌ Failed to create symlinks"
  exit 1
fi
