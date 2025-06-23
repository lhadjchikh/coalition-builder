# Coalition Builder Codex Instructions

This repository contains multiple components:

- `backend/` – Django REST API using Poetry
- `frontend/` – React + TypeScript client
- `ssr/` – optional Next.js app for server side rendering
- `terraform/` – IaC definitions

## Setup

### Option 1: Docker Compose (Recommended)

Use Docker Compose for a consistent environment with all dependencies:

```bash
# Start all services with dependencies installed
docker-compose up -d

# Run commands in containers
docker-compose exec backend poetry run python manage.py test
docker-compose exec frontend npm run test:ci
docker-compose exec backend python scripts/lint.py
```

### Option 2: Local Development

Before running tests or code quality checks, ensure dependencies are installed:

#### Backend Setup

```bash
cd backend
poetry install
```

#### Frontend Setup

```bash
cd frontend
npm install
```

#### SSR Setup (optional)

```bash
cd ssr
npm install
```

## Testing

### With Docker Compose (Recommended)

```bash
# Start services
docker-compose up -d

# Run tests
docker-compose exec backend poetry run python manage.py test
docker-compose exec frontend npm run test:ci
docker-compose exec ssr npm run test:ci
```

### Local Development

Run tests for each part when relevant (ensure dependencies are installed first):

```bash
# Backend tests (requires: cd backend && poetry install)
cd backend && poetry run python manage.py test

# Frontend unit/integration tests (requires: cd frontend && npm install)
cd frontend && npm run test:ci

# SSR integration tests (requires backend running and: cd ssr && npm install)
cd ssr && npm run test:ci
```

The SSR tests expect the backend API running at `http://localhost:8000`. Use `docker-compose up -d` or run the Django server manually if you need to execute them locally.

## Code Quality

### With Docker Compose (Recommended)

```bash
# Start services and run linting
docker-compose up -d
docker-compose exec backend python scripts/lint.py
```

### Local Development

Run the comprehensive linting script that handles all code quality checks:

```bash
python scripts/lint.py
```

This script runs formatting and linting across Python, frontend files, Terraform, and shell scripts.

#### Prerequisites for Local Development

- Backend: `cd backend && poetry install`
- Frontend: `cd frontend && npm install`

## Contributing Guidelines

- Follow existing project structure when adding new modules or components.
- Update or add tests along with code changes.
- Ensure linters and tests pass before opening a pull request.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
