# GitHub Workflows

This directory contains the GitHub Actions workflows for the Coalition Builder project. These workflows automate
testing and other CI/CD processes.

## CI/CD Architecture

This project uses a structured CI/CD pipeline with the following key workflows:

### Test Workflows

#### Frontend Tests (`test_frontend.yml`)

- Triggered by changes to files in the `frontend/` directory
- Runs on multiple Node.js versions (18.x and 20.x)
- Installs dependencies with `npm ci`
- Runs unit and integration tests (excluding E2E tests)
- Builds the frontend application
- Checks for TypeScript errors (if applicable)
- Can be manually triggered with `workflow_dispatch`

#### Backend Tests (`test_backend.yml`)

- Triggered by changes to files in the `backend/` directory, `docker-compose.yml`, or `Dockerfile`
- Sets up Docker and PostgreSQL
- Runs the Django tests inside a Docker container
- Can be manually triggered with `workflow_dispatch`

#### SSR Tests (`test_ssr.yml`)

- Triggered by changes to files in the `ssr/` directory
- Runs unit tests for the Server-Side Rendering (SSR) Next.js application
- Tests SSR functionality and API integration
- Can be manually triggered with `workflow_dispatch`

#### Full Stack Integration Tests (`test_fullstack.yml`)

- Runs on pushes to main branch, pull requests that affect both frontend and backend, or manual triggers
- Focuses specifically on end-to-end tests that verify frontend and backend integration
- Starts the complete application stack in Docker
- Runs the E2E tests from the frontend against the live backend

#### Terraform Tests (`test_terraform.yml`)

- Triggered by changes to files in the `terraform/` directory
- Validates Terraform configurations and formatting
- Runs comprehensive unit tests for individual modules (networking, compute, security, database)
- Runs integration tests that validate module interactions
- **Cost-aware testing**: Creates AWS resources only on main branch pushes or manual triggers
- Includes automatic resource cleanup and cost monitoring
- Supports manual testing scenarios with configurable options

**Test Types:**

- **Unit Tests**: Fast tests without AWS resources (networking, compute, security, database modules)
- **Integration Tests (Short)**: Module interaction tests without AWS resources
- **Integration Tests (Full)**: Complete infrastructure deployment with real AWS resources
- **Cost Monitoring**: Checks for leftover resources and creates alerts

### Deployment Workflows

#### Application Deployment (`deploy_app.yml`)

- Deploys the application to Amazon ECS
- Triggered automatically after all test workflows complete successfully
- Can be manually triggered with an option to skip tests
- Builds and pushes Docker images to ECR
- Updates ECS services with new task definitions

#### Infrastructure Deployment (`deploy_infra.yml`)

- Manages AWS infrastructure changes using Terraform
- Triggered by changes to `terraform/` directory on main branch
- Runs independently of application code changes
- Includes Terraform planning and apply steps
- Manages AWS resources like VPC, ECS clusters, RDS, and load balancers

### Documentation Workflow (`deploy_docs.yml`)

#### Documentation Generation and Deployment

- Triggered by changes to `docs/` directory or `mkdocs.yml`
- Builds comprehensive documentation from multiple sources:
  - **API Documentation**: Generated from Django backend using Sphinx
  - **Frontend Documentation**: Generated from TypeScript/React code using TypeDoc
  - **User Guides**: Written in Markdown and processed by MkDocs
- Deploys to GitHub Pages automatically on main branch pushes
- Combines backend API docs, frontend component docs, and user documentation into a unified site

### Code Quality and Linting Workflows

#### Python Linting (`lint_python.yml`)

- Runs Black code formatter and Ruff linter
- Triggered by changes to Python files
- Ensures consistent Python code style

#### Prettier Formatting (`lint_prettier.yml`)

- Runs Prettier for JavaScript, TypeScript, CSS, and Markdown files
- Ensures consistent formatting across frontend code
- Triggered by changes to relevant file types

#### TypeScript Linting (`lint_typescript.yml`)

- Runs ESLint and TypeScript compiler checks
- Validates TypeScript code quality and type safety
- Triggered by changes to TypeScript files

#### Terraform Linting (`lint_terraform.yml`)

- Runs `terraform fmt` and `tflint` for Terraform files
- Validates infrastructure code quality and formatting
- Triggered by changes to Terraform configurations

#### Go Linting (`lint_go.yml`)

- Runs various Go linters including `golangci-lint`, `staticcheck`, and `gosec`
- Ensures Go code quality in test modules
- Triggered by changes to Go files

#### Shell Script Linting (`lint_shellcheck.yml`)

- Runs ShellCheck for shell script validation
- Ensures shell scripts follow best practices
- Triggered by changes to shell script files

## Workflow Dependencies

```
Frontend Tests ────┐
Backend Tests ─────┼─► Application Deployment ─► Amazon ECS
SSR Tests ─────────┤
Full Stack Tests ──┘

Terraform Tests ──► Infrastructure Deployment ─► AWS Resources

Documentation ────► GitHub Pages

Linting Workflows:
├── Python Linting
├── Prettier Formatting
├── TypeScript Linting
├── Terraform Linting
├── Go Linting
└── Shell Script Linting
```

## Manual Triggers

All workflows can be manually triggered from the GitHub Actions UI. When manually triggering the deployment workflow, you have the option to skip the test requirement (use with caution).

## AWS Credentials

The deployment and infrastructure workflows require AWS credentials to be configured as GitHub environment secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

These credentials should be configured in the GitHub "prod" environment and have the necessary permissions for ECR, ECS, and any other AWS services used in the application.

All production-related jobs have been configured to use the "prod" environment to access these secrets.

## Running Tests Locally

### Frontend Tests

```bash
cd frontend
npm run test:ci          # Run all tests except E2E tests
npm run test:e2e         # Run only E2E tests (requires backend running)
```

### Backend Tests

```bash
cd backend
python manage.py test    # Run Django tests
```

### SSR Tests

```bash
cd ssr
npm test                 # Run SSR unit tests
npm run test:integration # Run integration tests with backend
```

### Terraform Tests

```bash
cd terraform/tests
go test ./...            # Run unit tests
go test -tags=integration ./...  # Run integration tests (requires AWS credentials)
```

### Linting and Code Quality

```bash
# Run all linters
python scripts/lint.py

# Individual linters
cd frontend && npm run lint    # TypeScript/JavaScript
cd backend && poetry run ruff check .  # Python
terraform fmt -check -recursive terraform/  # Terraform
shellcheck scripts/*.sh       # Shell scripts
```

## Documentation

The documentation workflow automatically builds and deploys comprehensive documentation that includes:

- **API Documentation**: Auto-generated from Django models, views, and serializers
- **Frontend Documentation**: Generated from TypeScript interfaces and React components
- **User Guides**: Markdown files covering installation, configuration, and usage
- **Infrastructure Documentation**: Terraform module documentation

The documentation is available at the GitHub Pages URL for this repository and is automatically updated when changes are pushed to the main branch.

## Adding New Workflows

When adding new workflows, please follow these conventions:

1. Name your workflow file descriptively (e.g., `component-name-action.yml`)
2. Include clear step names and descriptions
3. Group related jobs logically
4. Add appropriate triggers and path filters
5. Include the workflow in this README with description
6. Follow security best practices (minimal permissions, environment restrictions)
7. Add manual trigger capability where appropriate (`workflow_dispatch`)

## Site Protection Configuration

Coalition Builder includes automated password protection that deploys with infrastructure changes.

### Architecture

The system provides multiple authentication layers:

- **Next.js Middleware**: HTTP Basic Auth in SSR container (port 3000)
- **nginx Proxy**: Optional reverse proxy with HTTP Basic Auth (port 80)
- **Django Middleware**: Session-based authentication in API container (port 8000)

### Production Deployment

Site protection is managed through GitHub repository secrets:

| Secret                  | Required | Description                           |
| ----------------------- | -------- | ------------------------------------- |
| `SITE_PASSWORD_ENABLED` | Yes      | Enable protection (`true` or `false`) |
| `SITE_USERNAME`         | No\*     | HTTP Basic Auth username              |
| `SITE_PASSWORD`         | No\*     | Site access password                  |

\*Required when `SITE_PASSWORD_ENABLED` is `true`

The `deploy_infra.yml` workflow automatically:

1. Reads secrets from GitHub repository
2. Configures ECS containers with environment variables
3. Stores passwords securely in AWS Secrets Manager

### Development Setup

Configure password protection in your `.env` file:

```bash
SITE_PASSWORD_ENABLED=true
SITE_USERNAME=admin
SITE_PASSWORD=your-secure-password
```

Access methods:

- SSR Direct: `http://localhost:3000` (Next.js middleware)
- nginx Proxy: `http://localhost:80` (HTTP Basic Auth)
- API Direct: `http://localhost:8000` (Django middleware)
