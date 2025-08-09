# Docker Development with Hot Reloading

This guide explains how to use Docker Compose for local development with hot reloading enabled.

## Quick Start

1. **Set up environment files:**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit both .env files with your configuration
   ```

2. **Start services with hot reloading:**

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

## How It Works

The `docker-compose.dev.yml` file overrides the production configuration to enable development features:

### Backend (Django)

- **Hot Reloading**: Source code is mounted as a volume, Django's runserver auto-reloads on changes
- **Debug Mode**: Django DEBUG=True for detailed error pages
- **Build Target**: Uses `python-deps` stage with only dependencies installed
- **Command**: Runs Django development server instead of Gunicorn

### Frontend (Next.js)

- **Hot Reloading**: Source code is mounted, Next.js fast refresh enabled
- **Development Mode**: NODE_ENV=development for development features
- **Build Target**: Uses `frontend-builder` stage
- **Command**: Runs Next.js development server

## Making Changes

### Backend Changes

- Edit files in `backend/` directory
- Django server auto-reloads on Python file changes
- For new dependencies:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
  ```

### Frontend Changes

- Edit files in `frontend/` directory
- Next.js fast refresh updates browser instantly
- For new dependencies:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml build app
  ```

### Database Changes

- Run migrations:
  ```bash
  docker compose exec api python manage.py migrate
  ```
- Create superuser:
  ```bash
  docker compose exec api python manage.py createsuperuser
  ```

## Viewing Logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Specific service
docker compose logs -f api
docker compose logs -f app
```

## Stopping Services

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Troubleshooting

### File Changes Not Detected

- Ensure Docker has permission to access your project directory
- On Windows/Mac, check Docker Desktop file sharing settings
- Try setting `WATCHPACK_POLLING=true` for the frontend (already set in dev config)

### Port Already in Use

- Check for other services using ports 3000, 8000, or 5432
- Stop conflicting services or change ports in docker-compose.yml

### Database Connection Issues

- Ensure the database container is healthy: `docker compose ps`
- Check database logs: `docker compose logs db`
- Verify credentials in your .env files

## Production Mode

To run in production mode (without hot reloading):

```bash
docker compose up -d
```

This uses the standard `docker-compose.yml` without development overrides.
