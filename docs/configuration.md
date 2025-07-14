# Configuration

Coalition Builder is configured entirely through environment variables. This approach allows for easy deployment across different environments without code changes.

## Environment Files

Create `.env` files in the appropriate directories:

- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration (if needed)

## Essential Settings

### Database

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### Django

```bash
SECRET_KEY=your-secure-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Email

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Organization

```bash
ORGANIZATION_NAME="Your Organization"
ORG_TAGLINE="Your mission statement"
CONTACT_EMAIL="contact@yourdomain.com"
```

### Legal Compliance

Configure cookie consent and legal document management:

```bash
# Cookie consent is handled client-side with vanilla-cookieconsent
# No additional environment variables required

# Legal document contact information (update in fixtures/admin)
# See docs/user-guides/legal-compliance.md for setup instructions
```

### Theme System

The theme system allows for visual customization through the admin interface. Optional fallback values:

```bash
# Default theme colors (used when no active theme exists)
DEFAULT_PRIMARY_COLOR="#2563eb"
DEFAULT_SECONDARY_COLOR="#64748b"
DEFAULT_ACCENT_COLOR="#059669"

# Organization branding for fallback theme
DEFAULT_LOGO_URL="https://example.com/logo.png"
DEFAULT_FAVICON_URL="https://example.com/favicon.ico"
```

**Note**: These variables provide fallbacks only. The primary theme configuration is done through the Django admin interface or Theme API.

## Complete Reference

For a comprehensive list of all environment variables, see:
[Environment Variables Reference](reference/environment.md)

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secret keys
- Enable CSRF protection in production
- Configure proper ALLOWED_HOSTS

## Validation

Test your configuration with:

```bash
cd backend
poetry run python manage.py check --deploy
```
