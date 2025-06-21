# Testing Guide

This guide covers comprehensive testing strategies for Coalition Builder, including backend, frontend, SSR, and integration testing.

## Overview

Coalition Builder implements a multi-layered testing approach to ensure reliability and maintainability:

- **Backend Tests**: Django unit and integration tests
- **Frontend Tests**: React component and integration tests
- **SSR Tests**: Next.js server-side rendering tests
- **End-to-End Tests**: Full application flow testing
- **Infrastructure Tests**: Terraform and deployment validation

## Testing Architecture

### Test Types

1. **Unit Tests**: Test individual components or functions in isolation
2. **Integration Tests**: Test component interactions with mocked dependencies
3. **End-to-End Tests**: Test complete user workflows with real services
4. **API Tests**: Test REST API endpoints and data flows
5. **Infrastructure Tests**: Test Terraform configurations and AWS resources

### Test Environment Requirements

- **Backend Tests**: Python 3.13, Poetry, PostgreSQL (or SQLite for unit tests)
- **Frontend Tests**: Node.js 18+, npm, Jest, React Testing Library
- **SSR Tests**: Node.js 18+, backend API running
- **E2E Tests**: Full application stack running (backend + frontend/SSR)

## Backend Testing

### Django Test Configuration

Coalition Builder uses Django's built-in testing framework with pytest-style assertions:

```python
# backend/coalition/core/tests.py
from django.test import TestCase, Client
from django.contrib.auth.models import User
from coalition.core.models import HomePage, ContentBlock

class HomePageModelTest(TestCase):
    def setUp(self):
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test Hero",
            about_section_content="Test content",
            contact_email="test@example.com",
            is_active=True
        )

    def test_homepage_creation(self):
        """Test homepage model creation and fields"""
        self.assertEqual(self.homepage.organization_name, "Test Organization")
        self.assertTrue(self.homepage.is_active)
        self.assertEqual(HomePage.get_active(), self.homepage)

    def test_single_active_homepage(self):
        """Test that only one homepage can be active"""
        # Create another homepage
        homepage2 = HomePage.objects.create(
            organization_name="Test Org 2",
            tagline="Test tagline 2",
            hero_title="Test Hero 2",
            about_section_content="Test content 2",
            contact_email="test2@example.com",
            is_active=True
        )

        # First homepage should be deactivated
        self.homepage.refresh_from_db()
        self.assertFalse(self.homepage.is_active)
        self.assertTrue(homepage2.is_active)
```

### API Testing

Test API endpoints using Django's test client:

```python
# backend/coalition/api/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from coalition.core.models import HomePage, ContentBlock

class HomepageAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Building strong partnerships",
            hero_title="Welcome to Test Org",
            about_section_content="<p>We advocate for change</p>",
            contact_email="info@testorg.org",
            is_active=True
        )

        # Add content blocks
        ContentBlock.objects.create(
            homepage=self.homepage,
            title="Test Block",
            block_type="text",
            content="<p>Test content</p>",
            order=1,
            is_visible=True
        )

    def test_get_homepage_success(self):
        """Test successful homepage retrieval"""
        response = self.client.get("/api/homepage/")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["organization_name"], "Test Organization")
        self.assertEqual(len(data["content_blocks"]), 1)
        self.assertEqual(data["content_blocks"][0]["title"], "Test Block")

    def test_get_homepage_no_active(self):
        """Test response when no active homepage exists"""
        self.homepage.is_active = False
        self.homepage.save()

        response = self.client.get("/api/homepage/")
        self.assertEqual(response.status_code, 404)

    def test_content_blocks_ordered(self):
        """Test that content blocks are returned in correct order"""
        # Add another block with different order
        ContentBlock.objects.create(
            homepage=self.homepage,
            title="First Block",
            block_type="text",
            content="<p>This should appear first</p>",
            order=0,
            is_visible=True
        )

        response = self.client.get("/api/homepage/")
        data = response.json()

        blocks = data["content_blocks"]
        self.assertEqual(len(blocks), 2)
        self.assertEqual(blocks[0]["title"], "First Block")
        self.assertEqual(blocks[1]["title"], "Test Block")
```

### Model Testing

Test model validation and business logic:

```python
# backend/coalition/campaigns/tests.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from coalition.campaigns.models import PolicyCampaign

class PolicyCampaignTest(TestCase):
    def test_campaign_creation(self):
        """Test campaign model creation"""
        campaign = PolicyCampaign.objects.create(
            title="Clean Water Protection Act",
            slug="clean-water-protection-act",
            summary="Legislation to protect water quality",
            description="Comprehensive water protection legislation",
            active=True
        )

        self.assertEqual(campaign.title, "Clean Water Protection Act")
        self.assertTrue(campaign.active)
        self.assertIsNotNone(campaign.created_at)

    def test_slug_uniqueness(self):
        """Test that campaign slugs must be unique"""
        PolicyCampaign.objects.create(
            title="Test Campaign 1",
            slug="test-campaign",
            summary="Test summary 1"
        )

        # Should raise ValidationError for duplicate slug
        with self.assertRaises(ValidationError):
            campaign2 = PolicyCampaign(
                title="Test Campaign 2",
                slug="test-campaign",
                summary="Test summary 2"
            )
            campaign2.full_clean()
```

### Running Backend Tests

```bash
# Run all backend tests
cd backend && poetry run python manage.py test

# Run specific test module
poetry run python manage.py test coalition.core.tests

# Run with verbose output
poetry run python manage.py test -v 2

# Run with coverage
poetry run coverage run manage.py test
poetry run coverage report
poetry run coverage html  # Generate HTML report
```

## Frontend Testing

### React Component Testing

Test React components using Jest and React Testing Library:

```typescript
// frontend/src/tests/CampaignsList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CampaignsList } from '../components/CampaignsList';
import { api } from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('CampaignsList Component', () => {
  beforeEach(() => {
    mockedApi.getCampaigns.mockClear();
  });

  test('renders campaigns list', async () => {
    const mockCampaigns = [
      {
        id: 1,
        title: 'Clean Water Act',
        slug: 'clean-water-act',
        summary: 'Protect our waterways',
        active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Climate Action',
        slug: 'climate-action',
        summary: 'Address climate change',
        active: true,
        created_at: '2024-01-02T00:00:00Z'
      },
    ];

    mockedApi.getCampaigns.mockResolvedValue(mockCampaigns);

    render(<CampaignsList />);

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for campaigns to load
    await waitFor(() => {
      expect(screen.getByText('Clean Water Act')).toBeInTheDocument();
      expect(screen.getByText('Climate Action')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockedApi.getCampaigns).toHaveBeenCalledTimes(1);
  });

  test('handles API error gracefully', async () => {
    mockedApi.getCampaigns.mockRejectedValue(new Error('API Error'));

    render(<CampaignsList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load campaigns/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no campaigns', async () => {
    mockedApi.getCampaigns.mockResolvedValue([]);

    render(<CampaignsList />);

    await waitFor(() => {
      expect(screen.getByText(/no campaigns available/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

Test component integration with mocked API responses:

```typescript
// frontend/src/tests/integration/AppIntegration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { api } from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Integration Tests', () => {
  test('loads homepage data successfully', async () => {
    const mockHomepage = {
      id: 1,
      organization_name: 'Test Coalition',
      tagline: 'Building change together',
      hero_title: 'Welcome to Test Coalition',
      hero_subtitle: 'Join our movement',
      about_section_title: 'About Us',
      about_section_content: '<p>We advocate for change</p>',
      content_blocks: [
        {
          id: 1,
          title: 'Our Mission',
          block_type: 'text',
          content: '<p>Making a difference</p>',
          order: 1,
          is_visible: true,
        }
      ],
      is_active: true,
    };

    mockedApi.getHomepage.mockResolvedValue(mockHomepage);

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Coalition')).toBeInTheDocument();
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
    });
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
cd frontend && npm test

# Run tests without watch mode (for CI)
npm run test:ci

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- CampaignsList.test.tsx

# Run integration tests only
npm test -- --testPathPattern=integration
```

## End-to-End Testing

### Frontend E2E Tests

Test the complete application flow with a real backend:

```javascript
// frontend/src/tests/e2e/BackendIntegration.test.js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

describe("Backend Integration E2E", () => {
  beforeAll(async () => {
    // Verify backend is running
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/`);
      if (!response.ok) {
        throw new Error("Backend not available");
      }
    } catch (error) {
      console.error(
        "Backend is not running. Start it with: docker-compose up -d",
      );
      throw error;
    }
  });

  test("can fetch homepage data from real backend", async () => {
    const response = await fetch(`${API_BASE_URL}/api/homepage/`);

    if (response.status === 404) {
      console.warn(
        "No active homepage found - this is expected for empty database",
      );
      return;
    }

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("organization_name");
    expect(data).toHaveProperty("content_blocks");
    expect(Array.isArray(data.content_blocks)).toBe(true);
  });

  test("can fetch campaigns from real backend", async () => {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("can fetch stakeholders from real backend", async () => {
    const response = await fetch(`${API_BASE_URL}/api/stakeholders/`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## SSR Testing

### SSR Integration Tests

Test server-side rendering functionality:

```javascript
// ssr/tests/test-ssr-integration.js
const http = require("http");
const { execSync } = require("child_process");

async function testServerResponse(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          // Check status code
          if (
            options.expectStatus &&
            response.statusCode !== options.expectStatus
          ) {
            throw new Error(
              `Expected status ${options.expectStatus}, got ${response.statusCode}`,
            );
          }

          // Check content type
          if (options.expectContentType) {
            const contentType = response.headers["content-type"];
            if (!contentType.includes(options.expectContentType)) {
              throw new Error(
                `Expected content type ${options.expectContentType}, got ${contentType}`,
              );
            }
          }

          // Check content
          if (options.expectContent) {
            options.expectContent.forEach((expectedText) => {
              if (!data.includes(expectedText)) {
                throw new Error(
                  `Expected content "${expectedText}" not found in response`,
                );
              }
            });
          }

          resolve({
            statusCode: response.statusCode,
            data,
            headers: response.headers,
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function runSSRTests() {
  console.log("🧪 Running SSR Integration Tests...");

  try {
    // Test main page
    console.log("📄 Testing main page rendering...");
    await testServerResponse("http://localhost:3000", {
      expectStatus: 200,
      expectContentType: "text/html",
      expectContent: ["html", "Coalition Builder"],
    });

    // Test health endpoint
    console.log("🏥 Testing health endpoint...");
    await testServerResponse("http://localhost:3000/health", {
      expectStatus: 200,
      expectContentType: "application/json",
    });

    // Test metrics endpoint
    console.log("📊 Testing metrics endpoint...");
    await testServerResponse("http://localhost:3000/metrics", {
      expectStatus: 200,
      expectContentType: "application/json",
    });

    console.log("✅ All SSR integration tests passed!");
  } catch (error) {
    console.error("❌ SSR integration tests failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runSSRTests();
}

module.exports = { testServerResponse, runSSRTests };
```

### Running SSR Tests

```bash
# Run SSR tests (requires SSR server running)
cd ssr && npm test

# Run simple integration test
npm run test:simple

# Run comprehensive integration test
node tests/test-ssr-integration.js

# Set up and run tests with Docker
./scripts/run-integration-test.sh
```

## Infrastructure Testing

### Terraform Testing

Test infrastructure configurations using Terratest:

```go
// terraform/tests/integration/full_stack_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/stretchr/testify/assert"
)

func TestFullStackDeployment(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "environment": "test",
            "db_name":     "coalition_test",
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Test VPC creation
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)

    // Test database endpoint
    dbEndpoint := terraform.Output(t, terraformOptions, "database_endpoint")
    assert.NotEmpty(t, dbEndpoint)
    assert.Contains(t, dbEndpoint, "rds.amazonaws.com")

    // Test load balancer
    albDnsName := terraform.Output(t, terraformOptions, "alb_dns_name")
    assert.NotEmpty(t, albDnsName)
}
```

## Test Data Management

### Database Fixtures

Create test data using Django fixtures or factory functions:

```python
# backend/scripts/create_test_data.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coalition.settings')
django.setup()

from coalition.core.models import HomePage, ContentBlock
from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

def create_test_homepage():
    """Create test homepage configuration"""
    homepage = HomePage.objects.create(
        organization_name="Test Coalition Builder",
        tagline="Testing advocacy partnerships",
        hero_title="Welcome to Our Test Coalition",
        hero_subtitle="Join our testing efforts",
        about_section_title="About Our Test Mission",
        about_section_content="<p>We test to build strong coalitions.</p>",
        cta_title="Get Involved in Testing",
        cta_content="Help us test our platform",
        cta_button_text="View Test Campaigns",
        cta_button_url="https://example.com/campaigns/",
        contact_email="test@example.com",
        contact_phone="(555) 123-4567",
        is_active=True
    )

    # Add test content blocks
    ContentBlock.objects.create(
        homepage=homepage,
        title="Why Testing Matters",
        block_type="text",
        content="<p>Testing ensures our platform works reliably for advocacy organizations.</p>",
        order=1,
        is_visible=True
    )

    return homepage

def create_test_campaigns():
    """Create test campaigns"""
    campaigns = [
        PolicyCampaign.objects.create(
            title="Test Water Protection Act",
            slug="test-water-protection-act",
            summary="Test legislation to protect water quality",
            description="Comprehensive test water protection legislation",
            active=True
        ),
        PolicyCampaign.objects.create(
            title="Test Climate Action Bill",
            slug="test-climate-action-bill",
            summary="Test legislation for climate action",
            description="Test comprehensive climate action legislation",
            active=True
        ),
    ]
    return campaigns

if __name__ == "__main__":
    print("Creating test data...")
    homepage = create_test_homepage()
    campaigns = create_test_campaigns()
    print(f"Created test homepage: {homepage.organization_name}")
    print(f"Created {len(campaigns)} test campaigns")
    print("Test data creation complete!")
```

## Continuous Integration

### GitHub Actions Test Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: coalition_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.13"

      - name: Install dependencies
        working-directory: backend
        run: |
          pip install poetry
          poetry install

      - name: Run tests
        working-directory: backend
        run: poetry run python manage.py test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coalition_test

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run tests
        working-directory: frontend
        run: npm run test:ci

  ssr-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: ssr/package-lock.json

      - name: Install dependencies
        working-directory: ssr
        run: npm ci

      - name: Run tests
        working-directory: ssr
        run: npm run test:ci
```

## Best Practices

### Test Organization

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should clearly describe what is being tested
3. **Keep Tests Independent**: Each test should be able to run independently
4. **Mock External Dependencies**: Use mocks for API calls, database connections, etc.
5. **Test Edge Cases**: Include tests for error conditions and boundary cases

### Performance Considerations

1. **Use Test Databases**: Use separate databases for testing
2. **Parallel Execution**: Run tests in parallel when possible
3. **Selective Testing**: Run only relevant tests during development
4. **Test Data Cleanup**: Clean up test data between tests
5. **Optimize Fixtures**: Use factories instead of fixtures for better performance

### Debugging Tests

1. **Verbose Output**: Use verbose flags for detailed test output
2. **Isolated Execution**: Run individual tests to isolate failures
3. **Browser DevTools**: Use browser debugging tools for frontend tests
4. **Log Analysis**: Check application logs during test failures
5. **Test Coverage**: Use coverage tools to identify untested code

For more specific troubleshooting help, see the [main troubleshooting guide](../admin/troubleshooting.md).
