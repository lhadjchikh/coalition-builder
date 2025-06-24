# CSRF Security Configuration

Cross-Site Request Forgery (CSRF) protection is enabled by default for all POST endpoints in Coalition Builder. This document explains how to properly configure CSRF settings for different environments.

## Overview

CSRF protection prevents malicious websites from making unauthorized requests to your API on behalf of authenticated users. Coalition Builder implements comprehensive CSRF protection with proper configuration for both development and production environments.

## Environment Variables

### CSRF_TRUSTED_ORIGINS

Comma-separated list of trusted origins that can make CSRF-protected requests to your API.

```bash
# Production example
CSRF_TRUSTED_ORIGINS=https://mycoalition.org,https://www.mycoalition.org

# Multiple domains
CSRF_TRUSTED_ORIGINS=https://mycoalition.org,https://api.mycoalition.org,https://admin.mycoalition.org
```

**Important:**

- Include the full URL with protocol (`https://` or `http://`)
- Include all domains that will host your frontend application
- Include any subdomains that need access to the API

## Development Configuration

For development, the following origins are automatically trusted when `DEBUG=True`:

- `http://localhost:3000` (Next.js frontend)
- `http://127.0.0.1:3000`
- `http://localhost:8000` (Django development server)
- `http://127.0.0.1:8000`

No additional configuration is needed for local development.

## Production Configuration

### Required Settings

```bash
# Essential for CSRF protection
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Should be False in production
DEBUG=False

# Include your domain
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Security Settings

The following CSRF security settings are automatically configured:

```python
# Production settings (when DEBUG=False)
CSRF_COOKIE_SECURE = True          # Only send over HTTPS
CSRF_COOKIE_HTTPONLY = False       # Allow JavaScript access
CSRF_COOKIE_SAMESITE = "Lax"       # Protect against cross-site attacks
CSRF_USE_SESSIONS = False          # Use cookie-based tokens
```

## Frontend Integration

Your frontend needs to include CSRF tokens in API requests:

### Getting the CSRF Token

```javascript
// Get CSRF token from cookie
function getCsrfToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      return value;
    }
  }
  return null;
}
```

### Including CSRF Token in Requests

```javascript
// Include in fetch requests
const csrfToken = getCsrfToken();

fetch("/api/endorsements/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": csrfToken,
  },
  credentials: "include", // Important: include cookies
  body: JSON.stringify(data),
});
```

### React/Next.js Example

```javascript
// Custom hook for CSRF token
function useCsrfToken() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(getCsrfToken());
  }, []);

  return token;
}

// In component
function EndorsementForm() {
  const csrfToken = useCsrfToken();

  const submitForm = async (data) => {
    const response = await fetch("/api/endorsements/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
  };
}
```

## Testing CSRF Protection

### Valid Request (should succeed)

```bash
# Get CSRF token first
curl -c cookies.txt http://localhost:8000/api/some-endpoint/

# Extract token and use in POST
curl -b cookies.txt -H "X-CSRFToken: <token>" \
     -H "Content-Type: application/json" \
     -d '{"data": "value"}' \
     http://localhost:8000/api/endorsements/
```

### Invalid Request (should fail with 403)

```bash
# POST without CSRF token
curl -H "Content-Type: application/json" \
     -d '{"data": "value"}' \
     http://localhost:8000/api/endorsements/
```

## Troubleshooting

### Common Issues

**403 Forbidden on POST requests:**

- Check that `X-CSRFToken` header is included
- Verify CSRF token is valid and current
- Ensure `credentials: 'include'` is set in frontend requests

**CSRF token not found:**

- Check that your domain is in `CSRF_TRUSTED_ORIGINS`
- Verify cookies are being sent with requests
- Ensure frontend and backend are on compatible domains

**CSRF verification failed:**

- Check that origin domain matches `CSRF_TRUSTED_ORIGINS`
- Verify protocol (http/https) matches exactly
- Check for trailing slashes in origin configuration

### Debug Commands

```bash
# Check current CSRF settings
docker compose exec api python manage.py shell -c "
from django.conf import settings
print('CSRF_TRUSTED_ORIGINS:', settings.CSRF_TRUSTED_ORIGINS)
print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)
print('CSRF_COOKIE_SECURE:', settings.CSRF_COOKIE_SECURE)
"
```

## Security Considerations

### Production Checklist

- ✅ Set `CSRF_TRUSTED_ORIGINS` to only include your domains
- ✅ Use `https://` origins in production
- ✅ Set `DEBUG=False` to enable secure cookies
- ✅ Include all subdomains that need API access
- ✅ Use `ALLOWED_HOSTS` to restrict allowed domains

### Security Best Practices

1. **Minimal Origins**: Only include domains you control
2. **HTTPS Only**: Use HTTPS origins in production
3. **Subdomain Strategy**: Be explicit about which subdomains need access
4. **Regular Review**: Audit trusted origins regularly
5. **Environment Separation**: Use different origins for staging/production

## Related Documentation

- [Django CSRF Documentation](https://docs.djangoproject.com/en/stable/ref/csrf/)
- [Environment Variables](../reference/environment.md)
- [API Security](../admin/security.md)
- [Frontend Integration](../frontend/api-integration.md)
