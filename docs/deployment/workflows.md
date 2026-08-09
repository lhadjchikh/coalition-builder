# GitHub Actions Workflows

## Overview

The Coalition Builder uses GitHub Actions for continuous integration and deployment. The workflows are designed for the serverless architecture with Lambda (backend) and Vercel (frontend).

## Workflow Files

All workflows are located in `.github/workflows/`:

### Deployment Workflows

#### `deploy_lambda.yml`

Deploys the Django backend to AWS Lambda using Zappa.

**Triggers:**

- Backend changes pushed to `main` or `development`
- Manual workflow dispatch with environment selection (`dev`, `prod`)

**Authentication:**

Uses GitHub OIDC to assume the `github-actions-{environment}` IAM role — no long-lived AWS access keys required. The workflow needs:

- `AWS_ACCOUNT_ID` (variable, per GitHub environment)
- `id-token: write` permission for OIDC

**Process:**

1. Authenticates to AWS via OIDC (`aws-actions/configure-aws-credentials`)
2. Verifies the Lambda execution role can read the configured runtime secrets
3. Verifies the Lambda function and Zappa CloudFormation stack are consistent
4. Builds and pushes the GeoDjango image to Amazon ECR
5. Deploys or updates the Lambda function through Zappa
6. Creates the cache table, runs migrations, and collects static files
7. Requires the deployed API health check to succeed

Deployments use a per-environment concurrency lock. Lambda management actions use
the same lock so an update cannot overlap a rollback or other operational action.

#### `deploy_frontend.yml`

Deploys the Next.js frontend to Vercel.

**Triggers:**

- Push to `main` or `development` branches (when frontend files change)
- Pull requests (creates preview deployments)
- Manual workflow dispatch

**Environment Variables Required:**

- `VERCEL_TOKEN` (secret)
- `VERCEL_ORG_ID` (secret)
- `VERCEL_PROJECT_ID` (secret)
- `PRODUCTION_API_URL` (variable)
- `DEVELOPMENT_API_URL` (variable)
- `PRODUCTION_SITE_URL` (variable; fallback for non-production builds)
- `CLOUDFRONT_DOMAIN` (variable)

These must be repository-scoped because the frontend job does not select a
GitHub environment. `DEVELOPMENT_SITE_URL` is optional; when absent, preview and
development builds use `PRODUCTION_SITE_URL` for site metadata.

**Process:**

1. Installs dependencies
2. Builds Next.js application
3. Deploys to Vercel
4. Creates preview URL for PRs
5. Runs smoke tests

#### `deploy_infra.yml`

Plans and applies Terraform infrastructure changes for a selected environment.

**Triggers:**

- Push to `main` (when `terraform/` files change)
- Pull requests to `main` (plan only, no apply)
- Manual workflow dispatch with environment selection (`shared`, `prod`, `dev`)

**Authentication:**

Uses GitHub OIDC to assume the `github-actions-{environment}` IAM role. Each environment's Terraform runs in `terraform/environments/{env}/` with its own backend config.

**Process:**

1. Determines target environment from branch or manual input
2. Waits for Terraform test workflow to pass (on push)
3. Authenticates to AWS via OIDC
4. Runs `terraform init` with environment-specific `backend.hcl`
5. Runs `terraform plan`
6. Applies changes on `main` branch pushes (skips on PRs)

### Management Workflows

#### `lambda_management.yml`

Manages Lambda functions post-deployment.

The workflow authenticates with the selected environment's GitHub OIDC role; it
does not use long-lived AWS access keys.

**Actions Available:**

- `tail-logs` - View CloudWatch logs
- `rollback` - Rollback to previous version
- `undeploy` - Remove Lambda function
- `schedule` - Set up scheduled execution
- `unschedule` - Remove scheduled execution
- `invoke` - Manually invoke function
- `certify` - Certify deployment

**Usage:**

```bash
# Via GitHub UI
Actions → Lambda Management → Run workflow → Select action
```

#### `geodata_import.yml`

Runs geographic data imports using ECS Fargate.

**Import Types:**

- `tiger-states` - Import state boundaries
- `tiger-counties` - Import county boundaries
- `tiger-places` - Import city/place boundaries
- `all-tiger` - Import all TIGER data
- `custom` - Run custom import command

**Process:**

1. Configures import command
2. Runs ECS task with geodata-import container
3. Streams logs to workflow summary
4. Reports success/failure

### Testing Workflows

#### `test.yml`

Runs the complete test suite.

**Triggers:**

- Every push
- Pull requests

**Test Coverage:**

- Python backend tests (pytest)
- JavaScript frontend tests (Jest)
- TypeScript compilation
- Terraform validation
- Go tests for Terraform modules

#### `security.yml`

Runs security scans.

**Checks:**

- Python dependencies (safety)
- JavaScript dependencies (npm audit)
- Docker image scanning
- SAST scanning with CodeQL

## Environment Configuration

### Development Environment

```yaml
Environment: development
Branch: development or feature/*
Lambda Stage: dev
Vercel: Preview deployment
```

### Production Environment

```yaml
Environment: production
Branch: main
Lambda Stage: production
Vercel: Production deployment
Keep-warm: Yes (4 minutes)
X-Ray: Enabled
```

## Setting Up GitHub Environments

1. Go to Settings → Environments
2. Create two environments: `dev`, `prod`
3. Add environment-specific variables:

### Development

```bash
DOMAIN_NAME=api-dev.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
DEVELOPMENT_API_URL=https://api-dev.yourdomain.com
```

### Production

```bash
DOMAIN_NAME=api.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
PRODUCTION_API_URL=https://api.yourdomain.com
```

## Manual Deployment

### Deploy Lambda

```bash
# Using GitHub Actions
gh workflow run deploy_lambda.yml --ref main -f environment=prod

# Using Zappa directly
cd backend
poetry run zappa deploy prod
```

### Deploy Frontend

```bash
# Using GitHub Actions
gh workflow run deploy_frontend.yml --ref main -f environment=prod

# Using Vercel CLI
cd frontend
vercel --prod
```

## Monitoring Deployments

### View Deployment Status

```bash
# Lambda status
cd backend
poetry run zappa status prod

# Vercel status
vercel ls
```

### View Logs

```bash
# Lambda logs
poetry run zappa tail prod

# Vercel logs
vercel logs --follow
```

## Rollback Procedures

### Lambda Rollback

```bash
# Via GitHub Actions
gh workflow run lambda_management.yml -f action=rollback -f environment=prod

# Via Zappa
poetry run zappa rollback prod -n 1
```

### Vercel Rollback

```bash
# Via Vercel Dashboard
# Go to project → Deployments → Select previous → Promote to Production

# Via CLI
vercel rollback
```

## Troubleshooting

### Lambda Deployment Fails

1. Check OIDC role trust policy allows the GitHub environment/branch
2. Verify `AWS_ACCOUNT_ID` variable is set in the GitHub environment
3. Verify ECR repository exists
4. Check Zappa settings syntax
5. Review CloudWatch logs

### Vercel Deployment Fails

1. Check Vercel token is valid
2. Verify project and org IDs
3. Check build logs for errors
4. Ensure environment variables are set

### Domain Not Working

1. Verify certificate is validated in ACM
2. Check certificate covers the domain
3. Run `zappa certify` for Lambda
4. Check DNS propagation

## Cost Control

### Dev VPC Endpoints Toggle

The dev environment's two VPC endpoints (~$15/month at $0.01/hour per endpoint) can be disabled when you're not actively developing to save costs. Use the **Dev Cost Control** workflow:

```bash
# Disable VPC endpoints (saves ~$15/mo)
gh workflow run dev_cost_control.yml -f vpc_endpoints=disable

# Re-enable before developing
gh workflow run dev_cost_control.yml -f vpc_endpoints=enable
```

Or use the GitHub UI: **Actions > Dev Cost Control > Run workflow**.

When VPC endpoints are disabled, Lambda functions in the dev environment (which run in private subnets with no NAT/internet route) cannot reach Secrets Manager or the Geo Places API. CloudWatch Logs does not require an interface endpoint for Lambda's own logs. Re-enable the endpoints before deploying or testing the dev backend.

## Cost Monitoring

Compute is essentially free at current traffic — Lambda does not even appear as a Cost Explorer line item. The bill is dominated by always-on resources: VPC interface endpoints, RDS, and WAF. See [Cost Analysis](aws.md#cost-analysis) for the measured per-service breakdown.

Monitor usage:

- AWS Cost Explorer, grouped by service and then by usage type
- Vercel Analytics for bandwidth
- CloudWatch for detailed metrics
