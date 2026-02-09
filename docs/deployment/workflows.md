# GitHub Actions Workflows

## Overview

The Coalition Builder uses GitHub Actions for continuous integration and deployment. The workflows are designed for the serverless architecture with Lambda (backend) and Vercel (frontend).

## Workflow Files

All workflows are located in `.github/workflows/`:

### Deployment Workflows

#### `deploy-lambda.yml`

Deploys the Django backend to AWS Lambda using Zappa.

**Triggers:**

- Push to `main`, `staging`, or `development` branches
- Manual workflow dispatch

**Environment Variables Required:**

- `AWS_ACCESS_KEY_ID` (secret)
- `AWS_SECRET_ACCESS_KEY` (secret)
- `DOMAIN_NAME` (variable, optional)
- `CERTIFICATE_ARN` (variable, optional)

**Process:**

1. Builds Docker image with GeoDjango support
2. Pushes to Amazon ECR
3. Updates Zappa configuration
4. Deploys or updates Lambda function
5. Configures custom domain (if provided)
6. Runs health checks

#### `deploy-frontend.yml`

Deploys the Next.js frontend to Vercel.

**Triggers:**

- Push to `main`, `staging`, or `development` branches (when frontend files change)
- Pull requests (creates preview deployments)
- Manual workflow dispatch

**Environment Variables Required:**

- `VERCEL_TOKEN` (secret)
- `VERCEL_ORG_ID` (secret)
- `VERCEL_PROJECT_ID` (secret)
- `PRODUCTION_API_URL` (variable)
- `STAGING_API_URL` (variable)
- `DEVELOPMENT_API_URL` (variable)

**Process:**

1. Installs dependencies
2. Builds Next.js application
3. Deploys to Vercel
4. Creates preview URL for PRs
5. Runs smoke tests

### Management Workflows

#### `lambda-management.yml`

Manages Lambda functions post-deployment.

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

#### `geodata-import.yml`

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

### Staging Environment

```yaml
Environment: staging
Branch: staging
Lambda Stage: staging
Vercel: Staging deployment
Keep-warm: Yes (10 minutes)
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
2. Create three environments: `development`, `staging`, `production`
3. Add environment-specific variables:

### Development

```
DOMAIN_NAME=api-dev.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
DEVELOPMENT_API_URL=https://api-dev.yourdomain.com
```

### Staging

```
DOMAIN_NAME=api-staging.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
STAGING_API_URL=https://api-staging.yourdomain.com
```

### Production

```
DOMAIN_NAME=api.yourdomain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:...
PRODUCTION_API_URL=https://api.yourdomain.com
```

## Manual Deployment

### Deploy Lambda

```bash
# Using GitHub Actions
gh workflow run deploy-lambda.yml --ref main

# Using Zappa directly
cd backend
poetry run zappa deploy prod
```

### Deploy Frontend

```bash
# Using GitHub Actions
gh workflow run deploy-frontend.yml --ref main

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
gh workflow run lambda-management.yml -f action=rollback -f environment=prod

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

1. Check AWS credentials are set correctly
2. Verify ECR repository exists
3. Check Zappa settings syntax
4. Review CloudWatch logs

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

## Cost Monitoring

The serverless architecture significantly reduces costs:

- **Lambda**: Pay per invocation (~$5/month)
- **Vercel**: Free tier or $20/month Pro
- **DynamoDB**: Pay per request (~$1/month)
- **Total**: ~$39/month vs $73/month for ECS

Monitor usage:

- AWS Cost Explorer for Lambda/DynamoDB
- Vercel Analytics for bandwidth
- CloudWatch for detailed metrics
