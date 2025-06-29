# Deployment

Coalition Builder supports multiple deployment options. Choose the approach that best fits your infrastructure needs.

## Docker Deployment (Recommended)

The simplest way to deploy Coalition Builder is using Docker Compose:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development with hot reloading
docker-compose up -d
```

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 22+ (for local development)

### Configuration

Create `.env` file with production settings (see [Configuration](configuration.md)).

## AWS Deployment

For scalable production deployments, use the provided Terraform configuration:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### AWS Resources Created

- RDS PostgreSQL with PostGIS
- ECS/Fargate for application hosting
- ALB for load balancing
- CloudFront for CDN
- S3 for static files
- Redis for caching

### Prerequisites

- AWS CLI configured
- Terraform 1.0+
- Domain name and SSL certificate

## Manual Deployment

For custom deployments:

### Backend

```bash
cd backend
poetry install --only=main
poetry run python manage.py collectstatic
poetry run gunicorn coalition.core.wsgi
```

### Frontend

```bash
cd frontend
npm ci --production
npm run build
# Serve build/ directory with nginx/apache
```

## Environment Considerations

### Development

- Enable DEBUG mode
- Use SQLite for quick setup
- Local Redis or dummy cache

### Staging

- Mirror production settings
- Use separate database
- Enable logging and monitoring

### Production

- Disable DEBUG mode
- Use PostgreSQL with PostGIS
- Configure Redis for caching
- Set up SSL/HTTPS
- Configure email delivery
- Enable security headers

## Post-Deployment Setup

After deploying Coalition Builder, complete the initial setup:

**Automated on startup:**

- ✅ Database users and PostGIS setup (`init-db.sh`)
- ✅ Django migrations (`entrypoint.sh`)
- ✅ Static file collection (`entrypoint.sh`)

### 1. Create Django Admin User

Create a Django superuser to access the admin interface:

```bash
# Docker deployment
docker compose run --rm api python manage.py createsuperuser

# AWS deployment (using ECS exec)
aws ecs execute-command --cluster coalition-cluster \
  --task <task-id> --container api \
  --command "python manage.py createsuperuser" --interactive
```

### 2. Configure Initial Theme

1. Access Django admin at `/admin/`
2. Navigate to **Core** → **Themes** → **Add Theme**
3. Configure your organization's colors and branding
4. Mark the theme as "Active"

### 3. Load Sample Data (Optional)

```bash
# Load sample campaigns and content
docker compose run --rm api python manage.py loaddata sample_data/fixtures.json
```

## Health Monitoring

All deployments include health check endpoints:

- `/health/` - Application health
- `/api/health/` - API health
- `/metrics/` - Prometheus metrics

## Security Checklist

- [ ] HTTPS enabled
- [ ] Strong SECRET_KEY set
- [ ] Database credentials secured
- [ ] ALLOWED_HOSTS configured
- [ ] CSRF_TRUSTED_ORIGINS set
- [ ] Email credentials secured
- [ ] Static files served securely

## Troubleshooting

Common deployment issues:

- **Database connection failed**: Check DATABASE_URL and network access
- **Static files not loading**: Verify STATIC_URL and file permissions
- **CORS errors**: Configure CSRF_TRUSTED_ORIGINS
- **Email not sending**: Verify SMTP settings and credentials

## Detailed Guides

For comprehensive deployment instructions:

- [AWS Deployment Guide](deployment/aws.md) - Complete AWS setup with Terraform
- [Docker Deployment Guide](deployment/docker.md) - Advanced Docker configurations and troubleshooting
