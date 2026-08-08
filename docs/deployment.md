# Deployment Guide

## Overview

Coalition Builder uses a **serverless architecture** for cost-effective, scalable deployment. The application is split between AWS Lambda (Django backend) and Vercel (Next.js frontend). For the resource-by-resource cost breakdown, see [AWS Serverless Deployment](deployment/aws.md#cost-analysis).

## Quick Start

### 1. Prerequisites

- AWS CLI configured with deployment permissions
- GitHub repository with Actions enabled
- Domain name with DNS access (optional)
- Terraform 1.12+ for infrastructure

### 2. Deploy Infrastructure

Terraform is organized into per-account environments. Deploy `shared` first — it creates the VPC and RDS instance that `prod` and `dev` read via remote state.

```bash
cd terraform/environments/shared
terraform init -backend-config=backend.hcl
terraform apply

cd ../prod
terraform init -backend-config=backend.hcl
terraform apply
```

See [Multi-Account AWS Setup](deployment/multi-account-aws.md) for the bootstrap that must run before the first `terraform init`.

### 3. Configure GitHub Secrets and Variables

Deployment workflows authenticate to AWS with OIDC role assumption, so no long-lived AWS access keys are needed.

**Secrets:**

- `DATABASE_SECRET_ARN`, `DJANGO_SECRET_ARN` - Secrets Manager ARNs the Lambda role must be able to read
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Variables** (per GitHub Environment):

- `AWS_ACCOUNT_ID` - determines the `github-actions-<env>` role to assume
- `ZAPPA_S3_BUCKET`, `ZAPPA_ROLE_NAME` - from Terraform outputs
- `AWS_STORAGE_BUCKET_NAME`, `CLOUDFRONT_DOMAIN`
- `AWS_LOCATION_PLACE_INDEX_NAME`
- `VPC_SUBNET_IDS`, `VPC_SECURITY_GROUP_IDS`
- `PRODUCTION_API_URL` / `DEVELOPMENT_API_URL`, `PRODUCTION_SITE_URL` / `DEVELOPMENT_SITE_URL`

See [GitHub Environment Setup](deployment/github-environment-setup.md) for the full list.

### 4. Deploy Applications

```bash
# Backend to Lambda
gh workflow run deploy_lambda.yml --ref main -f environment=prod

# Frontend to Vercel
gh workflow run deploy_frontend.yml --ref main -f environment=prod
```

## Architecture

```text
Internet
    ├── Vercel (Next.js Frontend) ──/api/*──┐
    └── CloudFront CDN (static & media)     │
                                            ▼
                                    API Gateway → Lambda (Django via Zappa)
                                                     ├── RDS PostgreSQL + PostGIS
                                                     ├── S3 (static & media)
                                                     ├── SES (transactional email)
                                                     └── AWS Location Service (geocoding)

ECS Fargate (TIGER geodata imports only)
```

**Components:**

- **Frontend**: Next.js on Vercel Edge Network
- **Backend**: Django on AWS Lambda (via Zappa, as a container image)
- **Database**: RDS PostgreSQL with PostGIS
- **Rate Limiting**: PostgreSQL-backed Django cache — see [Rate Limiting](rate-limiting.md)
- **Geographic Data**: Imported via ECS Fargate tasks

The ALB, ECS application service, and NAT gateway from the pre-2025 deployment have been removed. The Lambda reaches AWS services through VPC endpoints rather than a NAT gateway. See [AWS Serverless Deployment](deployment/aws.md) for the full resource inventory.

## Deployment Options

### Production Deployment

**Automatic via GitHub Actions:**

- Push to `main` branch triggers production deployment
- Backend deploys to Lambda with production settings
- Frontend deploys to Vercel with custom domain

**Manual Deployment:**

```bash
# Lambda backend
cd backend
poetry run zappa deploy prod

# Vercel frontend
cd frontend
vercel --prod
```

### Development Deployment

**Automatic:**

- Push to `development` triggers a `dev` Lambda deployment and a Vercel deployment
- Pull requests touching `frontend/` get Vercel preview URLs

> **No staging environment.** `zappa_settings.json.template` defines a `staging` stage, but no Terraform environment or deployment workflow targets it. Only `dev` and `prod` are provisioned and wired to CI.

**Local Development:**

```bash
# Backend
cd backend
poetry install
poetry run python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Configuration

### Lambda Environments

Each Lambda stage has its own configuration:

```json
{
  "dev": {
    "memory_size": 512,
    "keep_warm": false,
    "environment_variables": {
      "ENVIRONMENT": "dev",
      "DEBUG": "true"
    }
  },
  "production": {
    "memory_size": 1024,
    "keep_warm": true,
    "xray_tracing": true,
    "environment_variables": {
      "ENVIRONMENT": "production",
      "DEBUG": "false"
    }
  }
}
```

### Vercel Environments

Environment variables are set via GitHub Actions:

- `NEXT_PUBLIC_API_URL`: Points to Lambda API Gateway
- `NEXT_PUBLIC_ENVIRONMENT`: Current environment
- `NEXT_PUBLIC_SITE_URL`: Frontend URL

## Custom Domains

### AWS Lambda (Backend)

1. **Create ACM Certificate:**

   ```bash
   aws acm request-certificate \
     --domain-name api.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Set GitHub Variables:**
   - `DOMAIN_NAME`: `api.yourdomain.com`
   - `CERTIFICATE_ARN`: ACM certificate ARN

3. **Deploy:** Domain is automatically configured via GitHub Actions

### Vercel (Frontend)

1. **Add Domain in Vercel Dashboard:**
   - Project Settings → Domains
   - Add `yourdomain.com`

2. **Configure DNS:**

   ```text
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## Monitoring & Logging

### CloudWatch (Lambda)

- Automatic log groups: `/aws/lambda/{function-name}`
- X-Ray tracing enabled for production
- Custom metrics via API Gateway

### Vercel Analytics

- Core Web Vitals
- Real User Monitoring
- Edge function performance

## Scaling

### Lambda Auto-Scaling

- Automatic based on request volume
- Reserved concurrency for production
- Keep-warm prevents cold starts

### Vercel Edge Network

- Global CDN with edge caching
- Automatic scaling to handle traffic spikes
- ISR (Incremental Static Regeneration)

## Security

### Backend (Lambda)

- VPC configuration for database access
- IAM roles with least privilege
- WAF integration via API Gateway
- DDoS protection via CloudFront

### Frontend (Vercel)

- Automatic HTTPS
- Security headers configured
- DDoS protection via edge network

## Backup & Recovery

### Database Backups

- Automated RDS snapshots (7-day retention)
- Point-in-time recovery enabled
- Cross-region backup replication

### Application Recovery

- Lambda versions for rollback
- Vercel deployment history
- Infrastructure as Code via Terraform

## Cost Management

The per-service cost breakdown lives in [AWS Serverless Deployment](deployment/aws.md#cost-analysis) so there is a single set of figures to keep current.

**Cost Optimization:**

- Lambda and API Gateway bill per request, with no idle cost
- Lambda keep-warm only for production
- Vercel free tier for development
- ECS only for occasional TIGER imports

## Troubleshooting

### Common Issues

1. **Lambda Cold Starts**
   - Enable keep-warm for production
   - Increase memory allocation
   - Use provisioned concurrency if needed

2. **Database Connection Errors**
   - Check VPC configuration
   - Verify security groups
   - Check connection pool settings

3. **Domain Not Working**
   - Verify ACM certificate validation
   - Check DNS propagation
   - Run `zappa certify` command

### Getting Help

- Check [GitHub Actions workflows](deployment/workflows.md)
- View [Lambda deployment guide](LAMBDA_DEPLOYMENT.md)
- See [Vercel deployment guide](VERCEL_DEPLOYMENT.md)
- Review CloudWatch logs for errors

## Migration from ECS

The migration from ECS Fargate to this serverless architecture is complete — see [PR #222](https://github.com/lhadjchikh/coalition-builder/pull/222). The ALB, ECS application service, and NAT gateway have been decommissioned, and no ECS deployment path remains for the application. ECS Fargate is still used for TIGER geodata imports; see [Geodata Import](deployment/geodata-import.md).
