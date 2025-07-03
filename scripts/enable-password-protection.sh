#!/bin/bash

# Enable password protection for the site
# Usage: ./scripts/enable-password-protection.sh [username] [password]

set -e

USERNAME=${1:-"dev"}
PASSWORD=${2}

# Require password to be provided
if [ -z "$PASSWORD" ]; then
  echo "❌ Error: Password is required for security."
  echo ""
  echo "Usage: $0 [username] <password>"
  echo ""
  echo "Examples:"
  echo "  $0 admin my-secure-password"
  echo "  $0 dev development-pwd-2024"
  echo ""
  exit 1
fi

echo "🔒 Enabling password protection for the site..."

# Generate .htpasswd file for nginx basic auth
echo "📝 Generating .htpasswd file..."
./scripts/generate-htpasswd.sh "$USERNAME" "$PASSWORD"

# Create or update .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "📄 Creating .env file..."
  cp .env.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
fi

# Update environment variables
echo "🔧 Updating environment variables..."

# Remove existing password protection settings
sed -i.bak '/^SITE_PASSWORD_ENABLED=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^SITE_PASSWORD=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^NGINX_CONFIG=/d' "$ENV_FILE" 2>/dev/null || true

# Add new settings
{
  echo ""
  echo "# Site Password Protection"
  echo "SITE_PASSWORD_ENABLED=true"
  echo "SITE_PASSWORD=$PASSWORD"
  echo "NGINX_CONFIG=./nginx.protected.conf"
} >>"$ENV_FILE"

# Clean up backup file
rm -f "$ENV_FILE.bak"

echo ""
echo "✅ Password protection enabled!"
echo ""
echo "📋 Configuration:"
echo "   Username: $USERNAME"
echo "   Password: $PASSWORD"
echo ""
echo "🚀 To apply changes:"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
echo "🔓 To disable password protection:"
echo "   ./scripts/disable-password-protection.sh"
