# Installation & Setup

This guide covers setting up Coalition Builder for development and production.

## Quick Start

### Option 1: Docker (Recommended)

**Prerequisites:**

- Docker and Docker Compose

```bash
# Clone the repository
git clone https://github.com/lhadjchikh/coalition-builder.git
cd coalition-builder

# For production/CI (optimized builds)
docker compose up -d

# For development (live code reload)
docker compose -f docker compose.yml -f docker compose.dev.yml up -d

# Create test data
docker compose exec api python scripts/create_test_data.py

# Create admin user
docker compose exec api python manage.py createsuperuser
```

**Access Points:**

- Frontend (SSR): http://localhost:3000
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

### Option 2: Manual Setup

**Prerequisites:**

- Python 3.13+
- Node.js 22+
- PostgreSQL 16+ with PostGIS extension
- Redis (for caching)

1. **Clone and setup backend:**

   ```bash
   git clone https://github.com/lhadjchikh/coalition-builder.git
   cd coalition-builder/backend
   poetry install
   ```

2. **Configure environment:**

   ```bash
   cp ../.env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**

   ```bash
   poetry run python manage.py migrate
   poetry run python manage.py createsuperuser
   ```

4. **Start backend:**

   ```bash
   poetry run python manage.py runserver
   ```

5. **Setup frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Production Deployment

For production deployment options, see:

- [AWS Deployment](deployment/aws.md)
- [Docker Deployment](deployment/docker.md)

## Configuration

All configuration is handled through environment variables. See the [Configuration Reference](configuration.md) for details.

## Next Steps

- [Configuration](configuration.md) - Environment variables and settings
- [Development Guide](development.md) - Contributing and development workflow
- [API Documentation](https://lhadjchikh.github.io/coalition-builder/api/) - Auto-generated API reference
