#!/bin/sh
# Docker entrypoint for nginx with conditional password protection

set -e

# Function to create htpasswd file
create_htpasswd() {
    echo "Creating .htpasswd file..."
    htpasswd -bc /etc/nginx/.htpasswd "${SITE_USERNAME}" "${SITE_PASSWORD}"
    echo "✅ Created .htpasswd with username: ${SITE_USERNAME}"
}

# Check if password protection is enabled
if [ "${SITE_PASSWORD_ENABLED}" = "true" ]; then
    echo "🔒 Site password protection is ENABLED"
    
    # Validate that username and password are provided
    if [ -z "${SITE_USERNAME}" ] || [ -z "${SITE_PASSWORD}" ]; then
        echo "❌ Error: SITE_USERNAME and SITE_PASSWORD must be set when SITE_PASSWORD_ENABLED=true"
        exit 1
    fi
    
    # Always recreate .htpasswd to ensure it matches environment variables
    create_htpasswd
    
    # Use protected configuration
    cp /etc/nginx/templates/nginx.protected.conf /etc/nginx/conf.d/default.conf
    echo "✅ Using protected nginx configuration"
else
    echo "🔓 Site password protection is DISABLED"
    
    # Use standard configuration
    cp /etc/nginx/templates/nginx.dev.conf /etc/nginx/conf.d/default.conf
    echo "✅ Using standard nginx configuration"
fi

# Execute the original nginx entrypoint
exec "$@"