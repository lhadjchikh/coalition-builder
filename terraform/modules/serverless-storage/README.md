# Serverless Storage Module

This module creates S3 buckets for serverless/Lambda deployments with automatic environment separation.

## Features

- **Automatic Environment Separation**: Creates separate buckets for dev, staging, and production
- **Cost Optimization**: Lifecycle rules for non-production environments
- **Security**: Different access policies per environment
- **CDN Support**: Optional CloudFront distributions for staging/production
- **Zero Configuration**: Works out of the box with sensible defaults

## Usage

### Basic Usage (Recommended for Open Source Contributors)

```hcl
module "serverless_storage" {
  source = "./modules/serverless-storage"
  
  # That's it! No configuration needed for basic setup
}
```

This creates three S3 buckets:
- `coalition-dev-assets` - Development environment
- `coalition-staging-assets` - Staging environment  
- `coalition-production-assets` - Production environment

### Advanced Usage

```hcl
module "serverless_storage" {
  source = "./modules/serverless-storage"
  
  project_name                  = "my-project"
  force_destroy_non_production  = true  # Allow destroying dev/staging buckets with content
  enable_lifecycle_rules        = true  # Auto-cleanup old files in dev/staging
  enable_cloudfront            = true  # Create CDN for staging/production
  
  # Production-specific settings
  production_cors_origins = [
    "https://myapp.com",
    "https://www.myapp.com"
  ]
  
  # Optional IP whitelist for production (leave empty for public access)
  production_ip_whitelist = []
}
```

## Bucket Configuration

### Development (`coalition-dev-assets`)
- **Versioning**: Disabled (to save costs)
- **Lifecycle**: 90-day expiration
- **CORS**: Allow all origins
- **Force Destroy**: Yes (easy cleanup)

### Staging (`coalition-staging-assets`)
- **Versioning**: Enabled
- **Lifecycle**: 180-day expiration
- **CORS**: Allow all origins
- **CloudFront**: Optional
- **Force Destroy**: Configurable

### Production (`coalition-production-assets`)
- **Versioning**: Enabled
- **Lifecycle**: Disabled (keep all data)
- **CORS**: Restricted to configured origins
- **CloudFront**: Optional (recommended)
- **Force Destroy**: No (protect data)

## Cost Optimization

The module includes automatic cost optimization:

1. **Lifecycle Rules** (non-production):
   - Incomplete uploads cleaned after 7 days
   - Files moved to Infrequent Access after 30 days
   - Old files deleted (90 days for dev, 180 for staging)

2. **Intelligent Tiering**: 
   - Development files auto-deleted
   - Staging files archived
   - Production files preserved

3. **CloudFront**: 
   - Optional CDN only for staging/production
   - Different price classes per environment

## IAM Policies

The module creates IAM policies for Lambda access:

```json
{
  "dev": "arn:aws:iam::*:policy/coalition-dev-assets-lambda-access",
  "staging": "arn:aws:iam::*:policy/coalition-staging-assets-lambda-access",
  "production": "arn:aws:iam::*:policy/coalition-production-assets-lambda-access"
}
```

Attach these to your Lambda execution roles as needed.

## Outputs

- `bucket_names` - Map of environment to bucket names
- `bucket_arns` - Map of environment to bucket ARNs
- `bucket_regional_domains` - Map of environment to S3 domain names
- `cloudfront_domains` - Map of environment to CDN domains (if enabled)
- `lambda_s3_policy_arns` - Map of environment to IAM policy ARNs
- `configuration_summary` - Complete configuration overview

## Migration from Single Bucket

If you're migrating from a single-bucket setup:

1. Deploy this module
2. Copy data from old bucket to appropriate environment bucket
3. Update application configuration to use new bucket names
4. Delete old bucket when ready

## For Open Source Contributors

This module is designed to work with zero configuration:

```bash
# Clone the repo
git clone https://github.com/yourorg/coalition-builder

# Deploy the infrastructure
cd terraform
terraform init
terraform apply -target=module.serverless_storage

# Buckets are ready to use!
```

The bucket names match what's expected in `backend/zappa_settings.json`, so no configuration changes are needed.