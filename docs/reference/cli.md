# Command Line Reference

This document provides a comprehensive reference for all command-line tools and scripts used in Coalition Builder development and deployment.

## Django Management Commands

### Core Django Commands

**Database Management:**

```bash
# Apply database migrations
poetry run python manage.py migrate

# Create new migration files
poetry run python manage.py makemigrations

# Show migration status
poetry run python manage.py showmigrations

# Rollback to specific migration
poetry run python manage.py migrate app_name migration_number

# Generate SQL for a migration (dry run)
poetry run python manage.py sqlmigrate app_name migration_number

# Check for migration issues
poetry run python manage.py check
```

**User Management:**

```bash
# Create superuser account
poetry run python manage.py createsuperuser

# Create superuser non-interactively
poetry run python manage.py createsuperuser \
    --username admin \
    --email admin@example.com \
    --noinput

# Change user password
poetry run python manage.py changepassword username
```

**Development Server:**

```bash
# Start development server
poetry run python manage.py runserver

# Start on specific port
poetry run python manage.py runserver 8080

# Start on specific host and port
poetry run python manage.py runserver 0.0.0.0:8000

# Start with custom settings
poetry run python manage.py runserver --settings=coalition.settings.development
```

**Static Files:**

```bash
# Collect static files for production
poetry run python manage.py collectstatic

# Collect static files without prompts
poetry run python manage.py collectstatic --noinput

# Clear static files and recollect
poetry run python manage.py collectstatic --clear --noinput
```

**Database Shell:**

```bash
# Open database shell
poetry run python manage.py dbshell

# Execute SQL file
poetry run python manage.py dbshell < backup.sql

# Run specific SQL command
echo "SELECT COUNT(*) FROM auth_user;" | poetry run python manage.py dbshell
```

**Python Shell:**

```bash
# Open Django shell
poetry run python manage.py shell

# Open Django shell with specific models imported
poetry run python manage.py shell_plus

# Run Python script with Django environment
poetry run python manage.py shell < script.py
```

### Testing Commands

```bash
# Run all tests
poetry run python manage.py test

# Run specific app tests
poetry run python manage.py test coalition.core

# Run specific test class
poetry run python manage.py test coalition.core.tests.HomePageTest

# Run specific test method
poetry run python manage.py test coalition.core.tests.HomePageTest.test_single_active_homepage

# Run tests with verbose output
poetry run python manage.py test -v 2

# Run tests and generate coverage report
poetry run coverage run manage.py test
poetry run coverage report
poetry run coverage html

# Run tests with specific settings
poetry run python manage.py test --settings=coalition.settings.testing

# Run tests with debugging
poetry run python manage.py test --debug-mode

# Run tests in parallel
poetry run python manage.py test --parallel

# Keep test database between runs
poetry run python manage.py test --keepdb
```

### Data Management Commands

```bash
# Load fixtures
poetry run python manage.py loaddata fixture_name

# Create fixture from current data
poetry run python manage.py dumpdata app_name > fixture.json

# Create fixture for specific model
poetry run python manage.py dumpdata app_name.ModelName > model_fixture.json

# Load fixture with specific format
poetry run python manage.py loaddata --format=json fixture.json
```

## Custom Scripts

### Test Data Creation

```bash
# Create test data for development
poetry run python scripts/create_test_data.py

# Create test data with specific environment
DJANGO_SETTINGS_MODULE=coalition.settings.development \
    poetry run python scripts/create_test_data.py

# Run from project root
cd backend && poetry run python scripts/create_test_data.py
```

**What this script creates:**

- Sample homepage configuration with content blocks
- Test policy campaigns with different statuses
- Sample stakeholders (farmers, businesses, nonprofits)
- Test endorsements linking stakeholders to campaigns
- Sample legislators with contact information

### Data Import/Export Scripts

```bash
# Export homepage data
poetry run python scripts/export_homepage.py > homepage_backup.json

# Import homepage data
poetry run python scripts/import_homepage.py homepage_backup.json

# Export campaigns
poetry run python scripts/export_campaigns.py --format=json > campaigns.json

# Import stakeholders from CSV
poetry run python scripts/import_stakeholders.py stakeholders.csv
```

## Poetry Commands

### Dependency Management

```bash
# Install dependencies
poetry install

# Install dependencies without dev packages
poetry install --no-dev

# Add new dependency
poetry add package_name

# Add development dependency
poetry add --group dev package_name

# Remove dependency
poetry remove package_name

# Update dependencies
poetry update

# Update specific package
poetry update package_name

# Show dependency tree
poetry show --tree

# Export requirements.txt
poetry export -f requirements.txt --output requirements.txt
```

### Virtual Environment

```bash
# Show virtual environment path
poetry env info

# Activate virtual environment
poetry shell

# Run command in virtual environment
poetry run command

# Show installed packages
poetry show

# Check for security vulnerabilities
poetry audit
```

## Code Quality Commands

### Linting and Formatting

```bash
# Format code with Black
poetry run black .

# Check code formatting without changes
poetry run black --check .

# Format specific files
poetry run black coalition/ tests/

# Lint with Ruff
poetry run ruff check .

# Auto-fix linting issues
poetry run ruff check --fix .

# Lint specific files
poetry run ruff check coalition/core/

# Check imports with isort
poetry run isort .

# Check imports without changes
poetry run isort --check-only .
```

### Type Checking

```bash
# Type check with mypy
poetry run mypy .

# Type check specific module
poetry run mypy coalition/core/

# Type check with specific config
poetry run mypy --config-file=mypy.ini .

# Generate type checking report
poetry run mypy --html-report=mypy_report .
```

## Docker Commands

### Development with Docker Compose

```bash
# Start all services
docker compose up

# Start services in background
docker compose up -d

# Start specific service
docker compose up backend

# Build and start services
docker compose up --build

# View logs
docker compose logs

# View logs for specific service
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart specific service
docker compose restart backend
```

### Service Management

```bash
# Run command in service container
docker compose exec backend poetry run python manage.py migrate

# Open shell in service container
docker compose exec backend bash

# Run Django shell in container
docker compose exec backend poetry run python manage.py shell

# Create superuser in container
docker compose exec backend poetry run python manage.py createsuperuser

# Check service status
docker compose ps

# View resource usage
docker compose top
```

### Database Operations with Docker

```bash
# Access database shell
docker compose exec db psql -U postgres -d coalition

# Run SQL file in database
docker compose exec -T db psql -U postgres -d coalition < backup.sql

# Create database backup
docker compose exec db pg_dump -U postgres coalition > backup.sql

# Restore database from backup
docker compose exec -T db psql -U postgres coalition < backup.sql

# Check database connectivity
docker compose exec backend poetry run python manage.py dbshell -c "SELECT 1;"
```

## AWS Deployment Commands

### Terraform Commands

```bash
# Initialize Terraform
cd terraform && terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy

# Show current state
terraform show

# List resources
terraform state list

# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0

# Validate configuration
terraform validate

# Format configuration files
terraform fmt

# Generate dependency graph
terraform graph | dot -Tpng > graph.png
```

### AWS CLI Commands

```bash
# Deploy to ECS
aws ecs update-service \
    --cluster coalition-cluster \
    --service coalition-backend \
    --force-new-deployment

# Check deployment status
aws ecs describe-services \
    --cluster coalition-cluster \
    --services coalition-backend

# View logs
aws logs get-log-events \
    --log-group-name /ecs/coalition-backend \
    --log-stream-name stream-name

# Update environment variables
aws ecs describe-task-definition \
    --task-definition coalition-backend \
    --query taskDefinition > task-def.json

# Register new task definition
aws ecs register-task-definition --cli-input-json file://task-def.json
```

## NPM/Frontend Commands

### React Frontend

```bash
# Install dependencies
cd frontend && npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests without watch mode
npm run test:ci

# Run tests with coverage
npm test -- --coverage

# Lint JavaScript/TypeScript
npm run lint

# Fix linting issues
npm run lint:fix

# Type check TypeScript
npm run type-check
```

### Next.js SSR

```bash
# Install dependencies
cd ssr && npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Analyze bundle size
npm run analyze
```

## Git Hooks and CI Commands

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run pre-commit on all files
pre-commit run --all-files

# Run specific hook
pre-commit run black

# Update hook versions
pre-commit autoupdate

# Skip pre-commit hooks
git commit --no-verify
```

### GitHub Actions Simulation

```bash
# Simulate backend tests locally
cd backend && poetry run python manage.py test

# Simulate frontend tests locally
cd frontend && npm run test:ci

# Simulate linting checks
poetry run black --check .
poetry run ruff check .
cd frontend && npm run lint

# Simulate type checking
poetry run mypy .
cd frontend && npm run type-check
```

## Health Check Commands

```bash
# Check backend health
curl http://localhost:8000/health/

# Check SSR health
curl http://localhost:3000/health

# Check database connectivity
docker compose exec backend poetry run python manage.py dbshell -c "SELECT 1;"

# Check all services
curl http://localhost:8000/health/ && \
curl http://localhost:3000/health && \
echo "All services healthy"
```

## Debugging Commands

### Django Debug

```bash
# Run server with debug mode
DEBUG=True poetry run python manage.py runserver

# Run shell with debug info
poetry run python manage.py shell --verbosity=2

# Debug specific test
poetry run python manage.py test --debug-mode coalition.core.tests.HomePageTest.test_creation

# Profile database queries
poetry run python manage.py shell
>>> from django.db import connection
>>> connection.queries  # Show all queries
```

### Docker Debug

```bash
# Check container logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Check container health
docker compose ps

# Inspect container details
docker inspect coalition-builder_backend_1

# Debug container startup
docker compose up --no-deps backend

# Run container with debugging
docker compose run --rm backend bash
```

## Performance and Monitoring

### Database Performance

```bash
# Analyze database performance
docker compose exec db psql -U postgres -d coalition -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;"

# Check slow queries
docker compose exec db psql -U postgres -d coalition -c "
SELECT query, state, query_start
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < NOW() - INTERVAL '5 minutes';"

# Database size analysis
docker compose exec db psql -U postgres -d coalition -c "
SELECT schemaname, tablename,
pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Application Monitoring

```bash
# Memory usage monitoring
docker stats coalition-builder_backend_1

# Process monitoring
docker compose exec backend ps aux

# Disk usage monitoring
docker compose exec backend df -h

# Network monitoring
docker compose exec backend netstat -tulpn
```

This comprehensive CLI reference covers all the essential commands for developing, testing, and deploying Coalition Builder. Use these commands to efficiently manage your development workflow and troubleshoot issues when they arise.
