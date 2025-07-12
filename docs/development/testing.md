# Testing Guide

This guide covers how to run tests locally for all components of Coalition Builder.

## Quick Start

Run all tests with the provided scripts:

```bash
# Run all linters and tests
./scripts/lint.py
cd backend && poetry run pytest
cd ../frontend && npm test
cd ../terraform && go test ./tests/...

# Individual test suites
cd backend && poetry run pytest    # Backend tests
cd frontend && npm test            # Frontend tests
cd ssr && npm test                 # SSR tests
```

## Backend Testing (Django + pytest)

### Setup

The backend uses pytest with Django integration for comprehensive testing.

```bash
cd backend

# Install dependencies
poetry install

# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=coalition

# Run specific test file
poetry run pytest coalition/core/tests/test_models.py

# Run tests matching pattern
poetry run pytest -k "test_site_protection"
```

### Test Categories

**Unit Tests:**

- Model validation and behavior
- API endpoint functionality
- Middleware and utility functions

**Integration Tests:**

- Database interactions
- API workflow testing
- Authentication and permissions

**Configuration Tests:**

- Environment variable handling
- Settings validation
- CSRF and security configurations

### Test Database

Tests use a separate test database that is automatically created and destroyed:

```bash
# Test database URL (automatically configured)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coalition_test
```

### Running Specific Test Types

```bash
# API tests
poetry run pytest coalition/api/tests.py

# Model tests
poetry run pytest coalition/*/tests/test_models.py

# Middleware tests
poetry run pytest coalition/middleware/tests/

# Site protection tests
poetry run pytest -k "site_protection"
```

## Frontend Testing (React + Jest)

### Setup

The frontend uses Jest with React Testing Library for component and integration testing.

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests once (CI mode)
npm run test:ci

# Run E2E tests (requires backend running)
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

### Test Categories

**Unit Tests:**

- Component rendering and behavior
- Hook functionality
- Utility functions

**Integration Tests:**

- API interactions
- Component integration
- Theme and context providers

**E2E Tests:**

- Full user workflows
- Cross-component interactions
- Backend integration

### Running Specific Tests

```bash
# Component tests
npm test -- --testNamePattern="HomePage"

# API integration tests
npm test -- src/tests/integration/

# E2E tests (requires backend)
npm run test:e2e
```

## SSR Testing (Next.js)

### Setup

The SSR application uses Jest for both unit testing and integration testing.

```bash
cd ssr

# Install dependencies
npm install

# Run unit tests
npm test

# Run integration tests with backend
npm run test:integration
```

### Test Categories

**Unit Tests:**

- Server-side rendering functionality
- API route handlers
- Component SSR behavior

**Integration Tests:**

- Backend API communication and health checks
- SSR rendering with real and fallback data
- Campaign page routing and rendering
- Full stack SSR + API integration within Docker Compose environment

Integration tests run using Jest and assume the backend API and SSR services are available (typically started via Docker Compose in the CI/CD workflow).

## Terraform Testing (Go)

### Setup

Infrastructure tests use Go testing framework with Terratest for infrastructure validation.

```bash
cd terraform/tests

# Install dependencies
go mod download

# Run unit tests (no AWS resources)
go test ./...

# Run integration tests (creates AWS resources)
go test -tags=integration ./...

# Run specific module tests
go test ./modules/networking_test.go
```

### Test Categories

**Unit Tests:**

- Terraform configuration validation
- Variable and output testing
- Module interface testing

**Integration Tests:**

- AWS resource creation
- Module interaction testing
- End-to-end infrastructure deployment

**Cost-Aware Testing:**

- Automatic resource cleanup
- Cost monitoring and alerts
- Short-lived test resources

## Shell Script Testing

### Setup

Shell scripts are tested using Bats (Bash Automated Testing System).

```bash
cd scripts/tests

# Run all shell script tests
./run_all_tests.sh

# Run specific test file
bats test_site_protection.bats
```

## Docker-Based Testing

### Full Stack Testing

Run tests in the complete Docker environment:

```bash
# Start the stack
docker compose up -d

# Run backend tests in container
docker compose exec api poetry run pytest

# Run frontend tests in container
docker compose exec frontend npm test

# Clean up
docker compose down
```

### Individual Container Testing

```bash
# Backend tests
docker compose run --rm api poetry run pytest

# Frontend tests
docker compose run --rm frontend npm run test:ci

# SSR tests
docker compose run --rm ssr npm test
```

## Test Configuration Files

### Backend (pytest.ini)

```ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = coalition.core.settings
python_files = tests.py test_*.py *_tests.py
addopts = --reuse-db --nomigrations
```

### Frontend (jest.config.js)

```javascript
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### SSR (jest.config.js)

```javascript
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  roots: ["<rootDir>/tests"],
};
```

## Continuous Integration

Tests run automatically on GitHub Actions:

- **Linting**: Code quality checks before tests
- **Unit Tests**: Component and module testing
- **Integration Tests**: Cross-component functionality
- **E2E Tests**: Full workflow validation

### Local CI Simulation

```bash
# Simulate the full CI pipeline locally
./scripts/lint.py          # Linting
./scripts/test-all.sh       # All tests
docker compose up -d        # Integration environment
npm run test:e2e           # E2E tests
```

## Debugging Tests

### Backend Debugging

```bash
# Run tests with verbose output
poetry run pytest -v

# Drop into debugger on failure
poetry run pytest --pdb

# Run specific test with debugging
poetry run pytest coalition/api/tests.py::TestEndorsementAPI::test_create_endorsement -v -s
```

### Frontend Debugging

```bash
# Run tests in watch mode
npm test -- --watch

# Debug specific test
npm test -- --testNamePattern="HomePage" --verbose
```

## Test Data and Fixtures

### Backend Fixtures

Django fixtures provide test data:

```bash
# Load test data
poetry run python manage.py loaddata backend/sample_data/fixtures.json

# Create test data
poetry run python manage.py shell
>>> from scripts.create_test_data import create_test_data
>>> create_test_data()
```

### Frontend Mock Data

Mock API responses for frontend testing:

```typescript
// src/__mocks__/api.ts
export const mockCampaigns = [
  { id: 1, title: "Test Campaign", description: "Test Description" },
];
```

## Performance Testing

### Backend Performance

```bash
# Run tests with profiling
poetry run pytest --profile

# Measure database query performance
poetry run pytest --ds=coalition.core.settings_test_performance
```

### Frontend Performance

```bash
# Bundle size analysis
npm run analyze

# Performance testing
npm test -- --testTimeout=10000
```

## Troubleshooting

### Common Issues

**Database Connection Errors:**

```bash
# Ensure PostgreSQL is running
docker compose up -d db

# Reset test database
poetry run python manage.py migrate --run-syncdb
```

**Frontend Test Timeouts:**

```bash
# Increase timeout for slow tests
npm test -- --testTimeout=30000
```

**Port Conflicts:**

```bash
# Use different ports for testing
export API_PORT=8001
export SSR_PORT=3001
```

### Test Environment Variables

```bash
# Backend testing
export DJANGO_SETTINGS_MODULE=coalition.core.settings_test
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coalition_test

# Frontend testing
export NODE_ENV=test
export NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Disable external services in tests
export EMAIL_BACKEND=django.core.mail.backends.locmem.EmailBackend
export CACHE_URL=locmem://
```
