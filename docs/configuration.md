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
