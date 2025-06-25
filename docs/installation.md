# Installation & Setup

This guide covers setting up Coalition Builder for development and production.

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 22+
- PostgreSQL 13+ with PostGIS extension
- Redis (for caching)

### Development Setup

1. **Clone and setup backend:**

   ```bash
   git clone https://github.com/lhadjchikh/coalition-builder.git
   cd coalition-builder/backend
   poetry install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
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
   npm start
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
- [API Documentation](api/) - Auto-generated API reference
