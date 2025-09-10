# Configuration

Coalition Builder is configured entirely through environment variables. This approach allows for easy deployment across different environments without code changes.

## Deployment-Specific Configuration

### Serverless (Lambda + Vercel)

For serverless deployments, configuration is managed through:

- **AWS Secrets Manager**: Sensitive values (database URLs, API keys)
- **GitHub Environment Variables**: Public configuration per environment
- **Lambda Environment Variables**: Runtime configuration
- **Vercel Environment Variables**: Frontend configuration

### Local Development

Create `.env` files in the appropriate directories:

- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration (gitignored)

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

# Serverless-specific
IS_LAMBDA=true  # Automatically detected in Lambda
ENVIRONMENT=production  # dev, staging, production
USE_GEODJANGO=true  # Enable PostGIS features
```

### Email

**Local Development:**

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Serverless (AWS SES):**

```bash
# Configured in Django settings for Lambda
# Uses IAM roles for authentication
# See docs/email-configuration.md for setup
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

### Serverless Configuration

#### Lambda Environment Variables

```bash
# Automatic detection
AWS_LAMBDA_FUNCTION_NAME=coalition-production  # Auto-set by Lambda
IS_LAMBDA=true  # Auto-detected

# Application settings
ENVIRONMENT=production
USE_GEODJANGO=true
USE_S3=true

# Database (from Secrets Manager)
DATABASE_URL=postgresql://...

# Storage
AWS_STORAGE_BUCKET_NAME=coalition-builder-assets
AWS_DEFAULT_REGION=us-east-1
```

#### Vercel Environment Variables

```bash
# Public variables (prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

#### GitHub Environment Variables

**Per Environment (development, staging, production):**

```bash
# Domains
DOMAIN_NAME=api.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:...

# API URLs
PRODUCTION_API_URL=https://api.yourdomain.com
STAGING_API_URL=https://api-staging.yourdomain.com
DEVELOPMENT_API_URL=https://api-dev.yourdomain.com

# Site URLs
PRODUCTION_SITE_URL=https://yourdomain.com
STAGING_SITE_URL=https://staging.yourdomain.com
DEVELOPMENT_SITE_URL=https://dev.yourdomain.com
```

## Complete Reference

For a comprehensive list of all environment variables, see:
[Environment Variables Reference](reference/environment.md)

## Security Notes

### Local Development

- Never commit `.env` files to version control
- Use strong, unique secret keys
- Enable CSRF protection in production
- Configure proper ALLOWED_HOSTS

### Serverless Deployment

- Sensitive values stored in AWS Secrets Manager
- IAM roles provide secure access without hardcoded credentials
- Environment variables are scoped per Lambda function
- GitHub secrets are encrypted and only accessible during workflows
- Vercel environment variables support preview/production scoping

## Environment-Specific Setup

### Local Development

1. **Create environment files:**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. **Configure database:**

   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/coalition_dev
   ```

3. **Test configuration:**

   ```bash
   cd backend
   poetry run python manage.py check --deploy
   ```

### Serverless Deployment

1. **Set GitHub Secrets:**

   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

2. **Configure environment variables per environment**
   See [Lambda Deployment Guide](lambda_deployment.md) and [Vercel Deployment Guide](vercel_deployment.md)

3. **Deploy infrastructure:**

   ```bash
   cd terraform
   terraform apply
   ```

## Validation

### Local Development

```bash
cd backend
poetry run python manage.py check --deploy
```

### Lambda Environment

```bash
# Via Zappa
cd backend
poetry run zappa invoke production '{"path": "/health/", "httpMethod": "GET"}'
```

### Frontend

```bash
cd frontend
npm run build  # Check for build-time env var issues
```
