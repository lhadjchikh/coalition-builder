# Testing Guide

This guide covers testing practices, test suites, and running tests for Coalition Builder.

## Test Organization

Coalition Builder uses multiple testing frameworks across different components:

- **Python/Django**: pytest-django (runs both pytest-style and Django TestCase tests)
- **TypeScript/React**: Jest for frontend tests
- **Go**: Built-in testing for Terraform modules
- **Shell Scripts**: Custom bash test framework

**Note**: The codebase contains both pytest-style tests (like the middleware tests) and traditional Django TestCase classes. pytest-django can run both types seamlessly.

## Running Tests

### Quick Start

Run all tests:

```bash
# All backend tests
cd backend && poetry run pytest

# All frontend tests
cd frontend && npm test

# All shell script tests
cd scripts/tests && ./run_all_tests.sh

# All Terraform tests
cd terraform/tests && go test ./...
```

### Backend Tests

#### Django Unit Tests

```bash
# Local development
cd backend
poetry run pytest

# Via Docker (recommended for consistency)
docker compose run --rm api poetry run pytest

# Specific app tests
poetry run pytest coalition/core/tests/
# or via Docker:
docker compose run --rm api poetry run pytest coalition/core/tests/

# With coverage
poetry run pytest --cov=coalition
# or via Docker:
docker compose run --rm api poetry run pytest --cov=coalition
```

#### Middleware Tests

```bash
# Password protection middleware (local)
poetry run pytest coalition/middleware/tests/

# Password protection middleware (Docker)
docker compose run --rm api poetry run pytest coalition/middleware/tests/

# Integration tests (local)
poetry run pytest coalition/core/tests/test_site_protection_integration.py

# Integration tests (Docker)
docker compose run --rm api poetry run pytest coalition/core/tests/test_site_protection_integration.py
```

### Frontend Tests

#### React Component Tests

```bash
cd frontend

# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test HomePage.test.tsx
```

#### Integration Tests

```bash
# End-to-end tests
npm run test:e2e

# Backend integration
npm run test:integration
```

### Infrastructure Tests

#### Terraform Module Tests

```bash
cd terraform/tests

# All Terraform tests
go test ./...

# Specific module tests
go test ./modules -run TestSitePasswordProtection -v

# With verbose output
go test -v ./...
```

## Password Protection Test Suite

The site password protection feature has comprehensive test coverage across multiple layers.

### Shell Script Tests

Test the password protection scripts located in `scripts/tests/`:

#### Quick Start

```bash
cd scripts/tests
./run_all_tests.sh
```

#### Individual Test Suites

Test the enable script:

```bash
./test_enable_password_protection.sh
```

Test the disable script:

```bash
./test_disable_password_protection.sh
```

#### Test Coverage - Shell Scripts

- ✅ Password requirement validation
- ✅ .env file creation and updates
- ✅ .htpasswd file generation
- ✅ Environment variable setting/removal
- ✅ Idempotency (no duplicates)

### Django Middleware Tests

The Django middleware tests are located in `backend/coalition/middleware/tests/`.

#### Running Middleware Tests

```bash
# Local development
cd backend
poetry run pytest coalition/middleware/tests/ -v

# Via Docker (recommended)
docker compose run --rm api poetry run pytest coalition/middleware/tests/ -v

# Integration tests (local)
poetry run pytest coalition/core/tests/test_site_protection_integration.py -v

# Integration tests (Docker)
docker compose run --rm api poetry run pytest coalition/core/tests/test_site_protection_integration.py -v
```

#### Test Coverage - Django Middleware

- ✅ Middleware enable/disable logic
- ✅ Password validation and error handling
- ✅ Login form rendering and CSRF protection
- ✅ Session authentication and persistence
- ✅ Excluded paths (health checks, admin)
- ✅ Password verification (correct/incorrect)
- ✅ Redirect logic and next URL handling
- ✅ Case-insensitive and numeric value handling

### Terraform Tests

The Terraform validation tests are in `terraform/tests/modules/site_protection_test.go`.

#### Running Terraform Tests

```bash
cd terraform/tests

# All password protection tests
go test ./modules -run TestSitePasswordProtection -v

# Compute module tests
go test ./modules -run TestComputeModulePasswordVariables -v
```

#### Test Coverage - Terraform

- ✅ Variable validation rules
- ✅ Required password when protection enabled
- ✅ Module integration with compute resources
- ✅ Error handling for missing passwords

## Test Development Guidelines

### Writing New Tests

When adding new features, ensure comprehensive test coverage:

1. **Shell script tests** for any new automation scripts
2. **Django tests** for middleware or API changes
3. **React tests** for frontend components
4. **Terraform tests** for infrastructure changes
5. **Integration tests** for end-to-end workflows

### Test Patterns

#### Django Test Fixtures

Use pytest fixtures for clean, reusable test setup:

```python
@pytest.fixture
def password_enabled_settings():
    """Settings with password protection enabled"""
    with override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="test-password"
    ):
        yield

@pytest.mark.usefixtures("password_enabled_settings")
def test_middleware_functionality(self, factory, get_response):
    # Test implementation
    pass
```

#### React Test Patterns

Use Jest and React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';

test('renders component with theme', () => {
  render(
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );

  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

#### Shell Script Tests

Use consistent test patterns with proper cleanup:

```bash
# Test setup
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Test execution
./script-under-test.sh arg1 arg2

# Assertions
if [ -f expected-file ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"
```

### Continuous Integration

All tests run automatically in GitHub Actions:

- **Python**: pytest with coverage reporting
- **TypeScript**: Jest with coverage thresholds
- **Go**: Built-in test runner
- **Shell**: Custom test runner with shellcheck
- **Linting**: Comprehensive code quality checks

### Performance Testing

For performance-critical features:

```python
import pytest
from django.test import TransactionTestCase
from django.test.utils import override_settings

class PerformanceTestCase(TransactionTestCase):
    def test_middleware_performance(self):
        # Measure middleware overhead
        pass
```

### Test Data Management

- Use **factories** for test data generation
- **Fixtures** for consistent test setup
- **Mocks** for external service calls
- **Database transactions** for test isolation

## Debugging Tests

### Failed Test Debugging

```bash
# Run specific failing test with verbose output
poetry run pytest path/to/test.py::TestClass::test_method -v -s

# Django tests with debug toolbar
python manage.py test --debug-mode

# Frontend tests with debugging
npm test -- --detectOpenHandles --verbose
```

### Test Coverage Analysis

```bash
# Backend coverage
poetry run pytest --cov=coalition --cov-report=html

# Frontend coverage
npm test -- --coverage --watchAll=false

# View coverage reports
open backend/htmlcov/index.html
open frontend/coverage/lcov-report/index.html
```

This comprehensive testing approach ensures reliability and maintainability across all Coalition Builder components.
