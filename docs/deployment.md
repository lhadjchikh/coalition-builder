# Deployment Guide

## Overview

Coalition Builder uses a **serverless architecture** for cost-effective, scalable deployment. The application is split between AWS Lambda (Django backend) and Vercel (Next.js frontend).

**Cost Savings**: ~46% reduction from legacy ECS deployment ($39/month vs $73/month)

## Quick Start

### 1. Prerequisites

- AWS CLI configured with deployment permissions
- GitHub repository with Actions enabled
- Domain name with DNS access (optional)
- Terraform 1.0+ for infrastructure

### 2. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform apply -target=module.dynamodb
terraform apply -target=module.zappa
terraform apply -target=module.geodata_import
```

### 3. Configure GitHub Secrets

Set these in your GitHub repository settings:

**Secrets:**

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Environment Variables** (per environment):

- `DOMAIN_NAME` (optional)
- `CERTIFICATE_ARN` (optional)
- `PRODUCTION_API_URL`
- `STAGING_API_URL`
- `DEVELOPMENT_API_URL`

### 4. Deploy Applications

```bash
# Backend to Lambda
gh workflow run deploy-lambda.yml --ref main

# Frontend to Vercel
gh workflow run deploy-frontend.yml --ref main
```

## Architecture

### Current: Serverless Architecture

```
Internet → CloudFront CDN
    ├── Vercel (Next.js Frontend)
    └── API Gateway → Lambda (Django)
         ├── RDS PostgreSQL
         └── DynamoDB (Rate Limiting)

ECS Fargate (TIGER Imports Only)
```

**Components:**

- **Frontend**: Next.js on Vercel Edge Network
- **Backend**: Django on AWS Lambda (via Zappa)
- **Database**: RDS PostgreSQL with PostGIS
- **Rate Limiting**: DynamoDB (replaces Redis)
- **Geographic Data**: Imported via ECS Fargate tasks

### Legacy: ECS Architecture (Deprecated)

The previous ECS-based deployment is still documented for reference but deprecated:

- Higher costs ($73/month vs $39/month)
- More complex infrastructure management
- Less scalable

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

### Staging Deployment

**Automatic:**

- Push to `staging` branch
- Deploys to staging environment with keep-warm enabled

### Development Deployment

**Automatic:**

- Push to feature branches creates preview deployments
- Pull requests get preview URLs

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

   ```
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

### Monthly Costs (Approximate)

**Serverless Architecture:**

- Lambda: ~$5
- API Gateway: ~$4
- Vercel: $0-20 (depending on traffic)
- RDS: ~$15
- DynamoDB: ~$1
- Other (S3, CloudWatch): ~$5
- **Total: ~$39/month**

**Cost Optimization:**

- DynamoDB pay-per-request billing
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

## Migration from Legacy

If migrating from the ECS deployment:

1. **Backup Data:** Export database and user uploads
2. **Test Serverless:** Deploy to staging first
3. **Update DNS:** Point to new endpoints
4. **Monitor:** Check performance and error rates
5. **Cleanup:** Remove ECS resources after verification

See the migration plan in `backend/local/SERVERLESS_MIGRATION_PLAN.md` for detailed steps.
