# Serverless Setup for Contributors

This guide helps you set up your own AWS resources for deploying the Coalition Builder application using Lambda and Zappa.

## Why Configuration is Needed

Since this is an open-source project, contributors need to use their own AWS resources. The `zappa_settings.json` file contains user-specific configuration that shouldn't be committed to version control.

## Quick Setup

### 1. Set Environment Variables

Export these environment variables before running the configuration:

```bash
# Required - Your AWS Account Details
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="us-east-1"

# S3 bucket for the environment being deployed (get this from Terraform output)
export ZAPPA_DEPLOYMENT_BUCKET="coalition-zappa-deployments-abc123"
export DEPLOYMENT_ENVIRONMENT="dev"
export AWS_STORAGE_BUCKET_NAME="coalition-dev-assets-abc123"

# Optional - Database names (defaults shown)
export DEV_DB_NAME="coalition_dev"
export STAGING_DB_NAME="coalition_staging"
export PRODUCTION_DB_NAME="coalition_production"

# Optional - For custom Docker images
export USE_CUSTOM_DOCKER="true"
export ECR_REGISTRY="123456789012.dkr.ecr.us-east-1.amazonaws.com"

# Optional - VPC Configuration (if using RDS in VPC)
export VPC_SUBNET_IDS="subnet-abc123,subnet-def456"
export VPC_SECURITY_GROUP_IDS="sg-abc123"
```

### 2. Generate Configuration

Run the configuration script:

```bash
cd backend
python scripts/configure-zappa.py
```

This generates `zappa_settings.json` with your specific configuration.

### 3. Deploy

```bash
# Deploy to development
zappa deploy dev

# Or update existing deployment
zappa update dev
```

## Using GitHub Actions

For CI/CD, add these as GitHub Secrets:

### Required Secrets

- `AWS_ACCOUNT_ID`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Required Variables

- `ZAPPA_DEPLOYMENT_BUCKET`
- `AWS_STORAGE_BUCKET_NAME` (set separately in each GitHub Environment)

### Optional Variables

- `VPC_SUBNET_IDS`
- `VPC_SECURITY_GROUP_IDS`
- `USE_CUSTOM_DOCKER`
- `ECR_REGISTRY`

The GitHub Actions workflow will automatically generate `zappa_settings.json` during deployment.

## Getting Bucket Names from Terraform

The media bucket that Django uploads to **must be the bucket whose upload policy is
attached to the Lambda role**, otherwise uploads fail with `AccessDenied` and media
returns 404/403. The bucket differs by environment, so read the value from the
matching Terraform output.

### Dev (`module.serverless_storage`)

```bash
cd terraform/environments/dev
terraform apply -target=module.serverless_storage
terraform output -raw serverless_bucket_name   # -> AWS_STORAGE_BUCKET_NAME
```

Set the dev environment's `AWS_STORAGE_BUCKET_NAME` to that bucket. Dev serves media
directly from S3, so `CLOUDFRONT_DOMAIN` is left unset. (Staging is generated as an
optional Zappa stage via `ENABLE_STAGING`, not a separate environment directory.)

### Production (`module.storage`)

Production media and collected static files live in `module.storage` — the bucket
whose `static_assets_upload_policy_arn` is attached to the Lambda role. Do **not**
use the `module.serverless_storage` production bucket; it has no Lambda policy
attachment and Django cannot write to it.

```bash
cd terraform/environments/prod
terraform output static_assets_bucket_name         # -> AWS_STORAGE_BUCKET_NAME
terraform output cloudfront_distribution_domain_name  # -> CLOUDFRONT_DOMAIN
```

Set the prod GitHub environment's `AWS_STORAGE_BUCKET_NAME` and `CLOUDFRONT_DOMAIN`
variables to these two outputs so Lambda writes to, and Django serves from, the same
bucket that is fronted by CloudFront.

## Configuration Options

### Basic Configuration (Public Lambda Image)

```bash
# Minimal setup - uses public Lambda Python image
export AWS_ACCOUNT_ID="123456789012"
export ZAPPA_DEPLOYMENT_BUCKET="my-zappa-bucket"
export DEPLOYMENT_ENVIRONMENT="dev"
export AWS_STORAGE_BUCKET_NAME="my-dev-assets"
```

### Advanced Configuration (Custom Docker + VPC)

```bash
# Full setup with custom Docker image and VPC
export AWS_ACCOUNT_ID="123456789012"
export USE_CUSTOM_DOCKER="true"
export ECR_REGISTRY="123456789012.dkr.ecr.us-east-1.amazonaws.com"
export VPC_SUBNET_IDS="subnet-abc123,subnet-def456"
export VPC_SECURITY_GROUP_IDS="sg-abc123"
```

## Troubleshooting

### Issue: zappa_settings.json not found

**Solution**: Run `python scripts/configure-zappa.py` to generate it.

### Issue: S3 bucket access denied

**Solution**: Ensure your IAM user/role has permissions for the specified buckets.

### Issue: Docker image not found

**Solution**: Build and push the Docker image first:

```bash
cd backend
./scripts/build-docker.sh dev
```

### Issue: VPC configuration errors

**Solution**: Ensure the subnet IDs and security group IDs exist in your AWS account.

## Security Best Practices

1. **Never commit** `zappa_settings.json` to version control
2. **Use AWS Secrets Manager** for sensitive data (configured in Terraform)
3. **Rotate credentials** regularly
4. **Use least privilege** IAM policies

## Example Workflow for New Contributors

1. Fork and clone the repository
2. Run Terraform to create AWS resources
3. Export environment variables with your resource names
4. Generate `zappa_settings.json`
5. Deploy to Lambda
6. Start developing!

```bash
# Complete example
git clone https://github.com/yourfork/coalition-builder
cd coalition-builder

# Create AWS resources
cd terraform
terraform init
terraform apply -target=module.serverless_storage
export DEPLOYMENT_ENVIRONMENT=dev
export AWS_STORAGE_BUCKET_NAME=$(terraform output -raw serverless_bucket_name)

# Configure Zappa
cd ../backend
export AWS_ACCOUNT_ID="123456789012"
export ZAPPA_DEPLOYMENT_BUCKET="my-zappa-deployments"
python scripts/configure-zappa.py

# Deploy
zappa deploy dev
```

## Next Steps

- [Configure Vercel](VERCEL_DEPLOYMENT.md) for frontend deployment
- [Set up GitHub Actions](deployment/workflows.md) for CI/CD
- Configure custom domain for production (see deployment documentation)
