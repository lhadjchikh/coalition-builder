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

Terraform is organized into per-account environments. Deploy `shared` first — it creates the database VPC and RDS instance that `prod` and `dev` read via remote state before creating their own application VPCs.

Production and development use separate logical databases on that shared instance. Follow the [Shared RDS database isolation runbook](deployment/database-isolation.md) before the first isolated dev deployment.

Complete the account bootstrap in [Multi-Account AWS Setup](deployment/multi-account-aws.md) and export the required `TF_VAR_*` inputs from [Configure GitHub Secrets and Variables](#3-configure-github-secrets-and-variables) before running Terraform manually. The backend setup script generates the gitignored `backend.hcl` in each environment directory.

```bash
cd terraform/environments/shared
../../scripts/setup_remote_state.sh shared
terraform init -backend-config=backend.hcl
terraform plan -out=tfplan
terraform apply tfplan

cd ../prod
../../scripts/setup_remote_state.sh prod
terraform init -backend-config=backend.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Configure GitHub Secrets and Variables

The Lambda, Lambda-management, and Terraform deployment workflows authenticate to AWS with OIDC role assumption. The legacy geodata-import workflow and Terraform integration-test job still use `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`; do not remove those credentials until those workflows are migrated or retired.

**Lambda GitHub Environment secrets** (`prod` and `dev`):

- `DATABASE_SECRET_ARN`, `DJANGO_SECRET_ARN` - Secrets Manager ARNs the Lambda role must be able to read

**Terraform GitHub Environment secrets:**

| Environment   | Required secrets                                                | Optional secret                                             |
| ------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `shared`      | `DB_USERNAME`, `DB_PASSWORD`, `APP_DB_USERNAME`                 | `TF_VAR_BASTION_PUBLIC_KEY` when `CREATE_NEW_KEY_PAIR=true` |
| `prod`, `dev` | `APP_DB_USERNAME`, `APP_DB_PASSWORD`, `SHARED_PEERING_ROLE_ARN` | `SITE_PASSWORD`                                             |

**Common Terraform GitHub Environment variables:**

- `AWS_ACCOUNT_ID`, `TF_VAR_PREFIX`, and `REPO_FULL_NAME`
- `DATABASE_ISOLATION_READY=true` for `dev`, set only after completing the database isolation runbook
- `TF_VAR_ALERT_EMAIL` for every environment
- `SHARED_ACCOUNT_ID` for `prod` and `dev`
- `TF_VAR_DOMAIN_NAME`, `BASTION_KEY_NAME`, `CREATE_NEW_KEY_PAIR`, `ALLOWED_BASTION_CIDRS`, and `ALLOWED_LAMBDA_CIDRS` for `shared`
- `SES_FROM_EMAIL`, `SES_NOTIFICATION_EMAIL`, and `TF_VAR_DOMAIN_NAME` for `prod`

The reusable Terraform workflow also accepts optional variables such as `TF_VAR_API_GATEWAY_ID` and additional bastion settings. Treat `.github/workflows/deploy_terraform_environment.yml` and `.github/scripts/validate_terraform_environment_variables.sh` as the authoritative input list.

**Lambda GitHub Environment variables** (`prod` and `dev`):

- `AWS_ACCOUNT_ID` - determines the `github-actions-<env>` role to assume
- `ZAPPA_S3_BUCKET`, `ZAPPA_ROLE_NAME` - from Terraform outputs
- `AWS_STORAGE_BUCKET_NAME`, `CLOUDFRONT_DOMAIN`
- `AWS_LOCATION_PLACE_INDEX_NAME`
- `VPC_SUBNET_IDS`, `VPC_SECURITY_GROUP_IDS`
- The selected environment's `PRODUCTION_API_URL` or `DEVELOPMENT_API_URL`
- `SITE_URL`, `DEFAULT_FROM_EMAIL` - required for production email links and the SES sender
- `ADMIN_NOTIFICATION_EMAILS`, `SES_CONFIGURATION_SET` - optional notification recipients and SES event tracking

**Repository secrets** (used by the frontend job, which does not select a GitHub Environment):

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Repository variables** (used by the frontend job, which has no GitHub Environment scope):

- `PRODUCTION_API_URL` / `DEVELOPMENT_API_URL`, `PRODUCTION_SITE_URL` / `DEVELOPMENT_SITE_URL`
- `AWS_STORAGE_BUCKET_NAME`, `CLOUDFRONT_DOMAIN`, `PRODUCTION_DOMAIN`
- `GOOGLE_ANALYTICS_ID` - optional analytics identifier

`PRODUCTION_API_URL` and `DEVELOPMENT_API_URL` intentionally exist at both repository and environment scope because the frontend and Lambda workflows read different scopes. See [Deployment Workflows](deployment/workflows.md) for workflow behavior.

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
                                                     ├── SES API (transactional email)
                                                     └── AWS Location Service (geocoding)

TIGER geodata import scaffolding (not currently provisioned)
```

Transactional email uses the SES API over a private VPC endpoint and authenticates through the Lambda execution role; see [PR #312](https://github.com/lhadjchikh/coalition-builder/pull/312).

**Components:**

- **Frontend**: Next.js on Vercel Edge Network
- **Backend**: Django on AWS Lambda (via Zappa, as a container image)
- **Database**: RDS PostgreSQL with PostGIS
- **Rate Limiting**: PostgreSQL-backed Django cache — see [Rate Limiting](rate-limiting.md)
- **Geographic Data**: The repository includes an ECS import module and workflow, but no current environment provisions them

The ALB, ECS application service, and NAT gateway from the previous ECS deployment have been removed. The Lambda reaches AWS services through VPC endpoints rather than a NAT gateway. See [AWS Serverless Deployment](deployment/aws.md) for the full resource inventory.

## Deployment Options

### Production Deployment

**Automatic via GitHub Actions:**

- Backend changes pushed to `main` deploy Lambda with production settings
- Frontend changes pushed to `main` independently deploy Vercel with the production custom domain

**Manual Deployment:**

```bash
# Lambda backend (preferred; builds and passes the immutable image URI)
gh workflow run deploy_lambda.yml --ref main -f environment=prod

# Vercel frontend
cd frontend
vercel --prod
```

### Development Deployment

**Automatic:**

- Backend changes pushed to `development` trigger the `dev` Lambda deployment
- Frontend changes pushed to `development` independently trigger the development Vercel deployment
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
- Retained TIGER import scaffolding incurs no ECS cost because no current environment provisions it

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
- View [Deployment Workflows](deployment/workflows.md)
- See [AWS Serverless Deployment](deployment/aws.md)
- Review CloudWatch logs for errors

## Migration from ECS

The migration from ECS Fargate to this serverless architecture is complete — see [PR #222](https://github.com/lhadjchikh/coalition-builder/pull/222). The ALB, ECS application service, and NAT gateway have been decommissioned, and no ECS deployment path remains for the application. ECS-based TIGER import scaffolding remains in the repository but is not provisioned in any current environment; see [Geodata Import](deployment/geodata-import.md).
