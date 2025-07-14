# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in Coalition Builder.

## Backend Environment Variables

### Database Configuration

| Variable       | Description                       | Default     | Required |
| -------------- | --------------------------------- | ----------- | -------- |
| `DATABASE_URL` | Full PostgreSQL connection string | -           | Yes      |
| `DB_NAME`      | Database name                     | `coalition` | No       |
| `DB_USER`      | Database username                 | `postgres`  | No       |
| `DB_PASSWORD`  | Database password                 | -           | No       |
| `DB_HOST`      | Database host                     | `localhost` | No       |
| `DB_PORT`      | Database port                     | `5432`      | No       |

**Example:**

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/coalition
```

### Django Configuration

| Variable               | Description                                 | Default     | Required |
| ---------------------- | ------------------------------------------- | ----------- | -------- |
| `SECRET_KEY`           | Django secret key for cryptographic signing | -           | Yes      |
| `DEBUG`                | Enable debug mode                           | `False`     | No       |
| `ALLOWED_HOSTS`        | Comma-separated list of allowed hosts       | `localhost` | No       |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF                    | -           | No       |
| `TIME_ZONE`            | Application timezone                        | `UTC`       | No       |
| `LANGUAGE_CODE`        | Default language                            | `en-us`     | No       |

**Example:**

```bash
SECRET_KEY=your-very-secure-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Organization Configuration

| Variable            | Description                      | Default                          | Required |
| ------------------- | -------------------------------- | -------------------------------- | -------- |
| `ORGANIZATION_NAME` | Organization name (fallback)     | `Coalition Builder`              | No       |
| `ORG_TAGLINE`       | Organization tagline (fallback)  | `Building advocacy partnerships` | No       |
| `CONTACT_EMAIL`     | Primary contact email (fallback) | -                                | No       |

**Note:** These serve as fallbacks when no active homepage configuration exists in the database.

**Example:**

```bash
ORGANIZATION_NAME="Environmental Coalition"
ORG_TAGLINE="Protecting our planet through policy"
CONTACT_EMAIL="info@environmentalcoalition.org"
```

### File Storage Configuration

| Variable                  | Description                           | Default     | Required   |
| ------------------------- | ------------------------------------- | ----------- | ---------- |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket name for media file uploads | -           | Production |
| `AWS_REGION`              | AWS region for S3 bucket              | `us-east-1` | No         |

**Note:** In production, media files (uploaded images) are automatically stored in AWS S3. The ECS task role provides authentication for S3 access.

**File Organization:**

- `logos/` - Organization logos from theme settings
- `favicons/` - Favicon uploads
- `backgrounds/` - Hero background images
- `content_blocks/` - Images from content blocks

**Example:**

```bash
AWS_STORAGE_BUCKET_NAME="my-org-static-assets"
AWS_REGION="us-west-2"
```

### Email Configuration

| Variable                             | Description                           | Default                 | Required |
| ------------------------------------ | ------------------------------------- | ----------------------- | -------- |
| `EMAIL_BACKEND`                      | Django email backend                  | `console`               | No       |
| `EMAIL_HOST`                         | SMTP host                             | -                       | No       |
| `EMAIL_PORT`                         | SMTP port                             | `587`                   | No       |
| `EMAIL_USE_TLS`                      | Use TLS encryption                    | `True`                  | No       |
| `EMAIL_HOST_USER`                    | SMTP username                         | -                       | No       |
| `EMAIL_HOST_PASSWORD`                | SMTP password                         | -                       | No       |
| `DEFAULT_FROM_EMAIL`                 | Default sender email                  | -                       | No       |
| `ADMIN_NOTIFICATION_EMAILS`          | Comma-separated admin emails          | -                       | No       |
| `AUTO_APPROVE_VERIFIED_ENDORSEMENTS` | Auto-approve after email verification | `true`                  | No       |
| `AKISMET_SECRET_API_KEY`             | Akismet API key for spam detection    | -                       | No       |
| `SITE_URL`                           | Base URL for email links              | -                       | Yes      |
| `API_URL`                            | Backend API URL (for admin links)     | `http://localhost:8000` | No       |

**Email Template Configuration:**

| Variable            | Description                  | Default             | Required |
| ------------------- | ---------------------------- | ------------------- | -------- |
| `ORGANIZATION_NAME` | Name used in email templates | `Coalition Builder` | No       |

**Example:**

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL="Coalition Builder <noreply@yourdomain.com>"
ADMIN_NOTIFICATION_EMAILS="admin1@yourdomain.com,admin2@yourdomain.com"
SITE_URL="https://yourdomain.com"
API_URL="https://api.yourdomain.com"
```

### Geocoding Configuration

| Variable                               | Description                                                 | Default | Required |
| -------------------------------------- | ----------------------------------------------------------- | ------- | -------- |
| `TIGER_GEOCODING_CONFIDENCE_THRESHOLD` | Maximum rating for accepting Tiger geocoder results (0-100) | `20`    | No       |

**Tiger Geocoder Rating Scale:**

- `0`: Exact match
- `1-10`: Very high confidence (recommended for urban areas)
- `10-20`: High confidence (default, good for most use cases)
- `20-30`: Moderate confidence (recommended for rural areas)
- `30+`: Low confidence (may produce inaccurate results)

**Example:**

```bash
# Stricter matching for urban areas with high-quality address data
TIGER_GEOCODING_CONFIDENCE_THRESHOLD=10

# More lenient matching for rural areas or incomplete addresses
TIGER_GEOCODING_CONFIDENCE_THRESHOLD=25
```

### Storage Configuration

| Variable                  | Description                       | Default     | Required |
| ------------------------- | --------------------------------- | ----------- | -------- |
| `USE_S3`                  | Use AWS S3 for static/media files | `False`     | No       |
| `AWS_ACCESS_KEY_ID`       | AWS access key                    | -           | No       |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret key                    | -           | No       |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket name                    | -           | No       |
| `AWS_S3_REGION_NAME`      | S3 region                         | `us-east-1` | No       |
| `AWS_S3_CUSTOM_DOMAIN`    | Custom S3 domain                  | -           | No       |

**Example:**

```bash
USE_S3=True
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME=coalition-builder-static
AWS_S3_REGION_NAME=us-east-1
```

### Endorsement System Configuration

| Variable                              | Description                      | Default | Required |
| ------------------------------------- | -------------------------------- | ------- | -------- |
| `ENDORSEMENT_RATE_LIMIT_WINDOW`       | Rate limit time window (seconds) | `300`   | No       |
| `ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS` | Max attempts per time window     | `3`     | No       |

**Spam Prevention Configuration:**

These settings can be customized to adjust spam detection sensitivity:

```bash
# Rate limiting (5 minutes = 300 seconds)
ENDORSEMENT_RATE_LIMIT_WINDOW=300
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=3

# Cache backend (required for rate limiting)
# Redis recommended for production and development
CACHE_URL=redis://localhost:6379/1
```

**Note:** The spam prevention system includes built-in configurations for:

- Suspicious email domain detection
- Content quality analysis
- Honeypot field validation
- Form timing analysis

### Logging Configuration

| Variable             | Description               | Default | Required |
| -------------------- | ------------------------- | ------- | -------- |
| `LOG_LEVEL`          | Application log level     | `INFO`  | No       |
| `SENTRY_DSN`         | Sentry error tracking DSN | -       | No       |
| `SENTRY_ENVIRONMENT` | Sentry environment tag    | -       | No       |

**Example:**

```bash
LOG_LEVEL=DEBUG
SENTRY_DSN=https://example@sentry.io/123456
SENTRY_ENVIRONMENT=production
```

## Frontend Environment Variables

### API Configuration

| Variable              | Description          | Default                     | Required |
| --------------------- | -------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` | No       |
| `REACT_APP_DEBUG`     | Enable debug logging | `false`                     | No       |

**Example:**

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
REACT_APP_DEBUG=true
```

### Organization Branding

| Variable                        | Description          | Default                          | Required |
| ------------------------------- | -------------------- | -------------------------------- | -------- |
| `NEXT_PUBLIC_ORGANIZATION_NAME` | Organization name    | `Coalition Builder`              | No       |
| `NEXT_PUBLIC_TAGLINE`           | Organization tagline | `Building advocacy partnerships` | No       |
| `NEXT_PUBLIC_PRIMARY_COLOR`     | Primary brand color  | `#1976d2`                        | No       |
| `NEXT_PUBLIC_LOGO_URL`          | Logo image URL       | -                                | No       |

**Example:**

```bash
NEXT_PUBLIC_ORGANIZATION_NAME="Environmental Coalition"
NEXT_PUBLIC_TAGLINE="Protecting our planet"
NEXT_PUBLIC_PRIMARY_COLOR="#2e7d32"
NEXT_PUBLIC_LOGO_URL="https://yourdomain.com/logo.png"
```

### Analytics and Tracking

| Variable                     | Description                  | Default | Required |
| ---------------------------- | ---------------------------- | ------- | -------- |
| `NEXT_PUBLIC_GA_TRACKING_ID` | Google Analytics tracking ID | -       | No       |
| `NEXT_PUBLIC_HOTJAR_ID`      | Hotjar site ID               | -       | No       |

**Google Analytics Integration:**

When `NEXT_PUBLIC_GA_TRACKING_ID` is provided, the application automatically:

- Loads Google Analytics scripts on both frontend and SSR applications
- Respects cookie consent preferences (only tracks when analytics cookies are enabled)
- Tracks page views, campaign views, endorsement submissions, and form interactions
- Enables privacy-compliant tracking with IP anonymization and secure cookies

**Example:**

```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567
```

**Notes:**

- Use Google Analytics 4 (GA4) measurement IDs starting with "G-"
- Analytics only activates when users consent to analytics cookies
- Leave blank to disable all analytics tracking

## SSR Environment Variables

### Server Configuration

| Variable              | Description                   | Default                     | Required |
| --------------------- | ----------------------------- | --------------------------- | -------- |
| `API_URL`             | Backend API URL (server-side) | `http://localhost:8000`     | No       |
| `NEXT_PUBLIC_API_URL` | Backend API URL (client-side) | `http://localhost:8000/api` | No       |
| `PORT`                | Server port                   | `3000`                      | No       |
| `NODE_ENV`            | Node environment              | `development`               | No       |
| `HOSTNAME`            | Server hostname               | `localhost`                 | No       |

**Example:**

```bash
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

### Next.js Configuration

| Variable                  | Description               | Default | Required |
| ------------------------- | ------------------------- | ------- | -------- |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `false` | No       |
| `ANALYZE`                 | Enable bundle analyzer    | `false` | No       |

**Example:**

```bash
NEXT_TELEMETRY_DISABLED=1
ANALYZE=true
```

## Terraform/Deployment Variables

### AWS Configuration

| Variable                | Description                | Default             | Required |
| ----------------------- | -------------------------- | ------------------- | -------- |
| `AWS_REGION`            | AWS deployment region      | `us-east-1`         | Yes      |
| `AWS_ACCESS_KEY_ID`     | AWS access key             | -                   | Yes      |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key             | -                   | Yes      |
| `TF_VAR_aws_region`     | Terraform AWS region       | -                   | Yes      |
| `TF_VAR_environment`    | Deployment environment     | `production`        | No       |
| `TF_VAR_project_name`   | Project name for resources | `coalition-builder` | No       |

### Domain and SSL

| Variable                     | Description            | Default | Required |
| ---------------------------- | ---------------------- | ------- | -------- |
| `TF_VAR_domain_name`         | Primary domain name    | -       | Yes      |
| `TF_VAR_acm_certificate_arn` | SSL certificate ARN    | -       | Yes      |
| `TF_VAR_route53_zone_id`     | Route53 hosted zone ID | -       | Yes      |

**Example:**

```bash
TF_VAR_domain_name=yourdomain.com
TF_VAR_acm_certificate_arn=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
TF_VAR_route53_zone_id=Z1D633PJN98FT9
```

### Database Configuration

| Variable                     | Description                   | Default            | Required |
| ---------------------------- | ----------------------------- | ------------------ | -------- |
| `TF_VAR_db_name`             | Database name                 | `coalition`        | No       |
| `TF_VAR_db_master_username`  | Master database username      | `coalition_master` | No       |
| `TF_VAR_db_username`         | Application database username | `coalition_app`    | No       |
| `TF_VAR_use_secrets_manager` | Use AWS Secrets Manager       | `true`             | No       |

### Monitoring and Alerts

| Variable              | Description                | Default | Required |
| --------------------- | -------------------------- | ------- | -------- |
| `TF_VAR_alert_email`  | Email for alerts           | -       | Yes      |
| `TF_VAR_budget_limit` | Monthly budget limit (USD) | `30`    | No       |

**Example:**

```bash
TF_VAR_alert_email=admin@yourdomain.com
TF_VAR_budget_limit=50
```

## Environment Files

### Development (.env.development)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coalition

# Django
DEBUG=True
SECRET_KEY=development-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Organization (fallbacks)
ORGANIZATION_NAME="Coalition Builder Development"
ORG_TAGLINE="Building advocacy partnerships"
CONTACT_EMAIL="dev@coalitionbuilder.org"

# Email (development - uses console backend)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL="Coalition Builder Dev <noreply@localhost>"
ADMIN_NOTIFICATION_EMAILS="admin@localhost"
SITE_URL="http://localhost:3000"

# Endorsement System
ENDORSEMENT_RATE_LIMIT_WINDOW=300
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=3

# Cache (for rate limiting) - Redis container in docker compose
CACHE_URL=redis://redis:6379/1

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true

# SSR
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
PORT=3000
NODE_ENV=development
```

### Production (.env.production)

```bash
# Database (use AWS Secrets Manager in production)
# DATABASE_URL loaded from secrets

# Django
DEBUG=False
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Organization
ORGANIZATION_NAME="Your Organization"
ORG_TAGLINE="Your mission statement"
CONTACT_EMAIL="info@yourdomain.com"

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourmailprovider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=${EMAIL_USER}
EMAIL_HOST_PASSWORD=${EMAIL_PASSWORD}
DEFAULT_FROM_EMAIL="Your Organization <noreply@yourdomain.com>"
ADMIN_NOTIFICATION_EMAILS="admin@yourdomain.com,moderator@yourdomain.com"
SITE_URL="https://yourdomain.com"

# Endorsement System
ENDORSEMENT_RATE_LIMIT_WINDOW=300
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=3

# Cache (Redis recommended for production)
CACHE_URL=redis://redis:6379/1

# Storage
USE_S3=True
AWS_STORAGE_BUCKET_NAME=${S3_BUCKET_NAME}

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# SSR
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Monitoring
LOG_LEVEL=INFO
SENTRY_DSN=${SENTRY_DSN}
SENTRY_ENVIRONMENT=production
```

### Testing (.env.test)

```bash
# Test Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coalition_test

# Django Test Settings
DEBUG=True
SECRET_KEY=test-secret-key-for-testing-only
ALLOWED_HOSTS=localhost,testserver

# Disable external services in tests
EMAIL_BACKEND=django.core.mail.backends.locmem.EmailBackend
USE_S3=False

# Email settings for testing
DEFAULT_FROM_EMAIL="Test Coalition <test@example.com>"
ADMIN_NOTIFICATION_EMAILS="admin@example.com"
AUTO_APPROVE_VERIFIED_ENDORSEMENTS="false"  # Require manual admin review
SITE_URL="http://testserver"

# Endorsement system testing
ENDORSEMENT_RATE_LIMIT_WINDOW=60
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=10

# Cache for testing (in-memory)
CACHE_URL=locmem://

# Test Organization Settings
ORGANIZATION_NAME="Test Coalition"
ORG_TAGLINE="Testing advocacy partnerships"
CONTACT_EMAIL="test@example.com"

# Frontend Test Settings
NEXT_PUBLIC_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true

# SSR Test Settings
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=test
```

For more information on specific configurations, see the relevant component documentation.
