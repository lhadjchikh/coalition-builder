#!/bin/bash

# Disable password protection for the site
# Usage: ./scripts/disable-password-protection.sh

set -e

echo "🔓 Disabling password protection for the site..."

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "📄 No .env file found, creating one..."
  cp .env.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
fi

# Update environment variables
echo "🔧 Updating environment variables..."

# Remove existing password protection settings
sed -i.bak '/^SITE_PASSWORD_ENABLED=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^SITE_PASSWORD=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^NGINX_CONFIG=/d' "$ENV_FILE" 2>/dev/null || true

# Add disabled settings
{
  echo ""
  echo "# Site Password Protection (Disabled)"
  echo "SITE_PASSWORD_ENABLED=false"
  echo "# SITE_PASSWORD=preview"
  echo "# NGINX_CONFIG=./nginx.dev.conf"
} >>"$ENV_FILE"

# Clean up backup file
rm -f "$ENV_FILE.bak"

echo ""
echo "✅ Password protection disabled!"
echo ""
echo "🚀 To apply changes:"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
echo "🔒 To enable password protection:"
echo "   ./scripts/enable-password-protection.sh [username] [password]"
