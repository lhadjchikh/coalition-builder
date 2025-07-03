#!/bin/bash

# Generate .htpasswd file for nginx basic auth
# Usage: ./scripts/generate-htpasswd.sh [username] [password]

set -e

USERNAME=${1:-"dev"}
PASSWORD=${2:-"preview"}

echo "Generating .htpasswd file for nginx basic auth..."
echo "Username: $USERNAME"

# Create .htpasswd file
htpasswd -bc .htpasswd "$USERNAME" "$PASSWORD"

echo "✅ Generated .htpasswd file"
echo "📋 You can now use these credentials to access the site:"
echo "   Username: $USERNAME"
echo "   Password: $PASSWORD"
echo ""
echo "💡 To use different credentials, run:"
echo "   ./scripts/generate-htpasswd.sh your_username your_password"
