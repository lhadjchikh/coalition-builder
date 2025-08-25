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
  
  # Creates buckets with random suffixes for uniqueness
}
```

This creates three S3 buckets with a shared random suffix for uniqueness:
- `coalition-dev-assets-abc123` - Development environment
- `coalition-staging-assets-abc123` - Staging environment  
- `coalition-production-assets-abc123` - Production environment

Note: All buckets share the same random suffix (e.g., `abc123`), making them easier to identify and manage as a set.

After running `terraform apply`, the actual bucket names will be shown in the output. You'll need to update your configuration files with these names.

### Option 1: Use Predictable Names (For Your Own AWS Account)

If you control the AWS account and want predictable names:

```hcl
module "serverless_storage" {
  source = "./modules/serverless-storage"
  
  use_random_suffix = false  # Creates fixed names without random suffix
}
```

This creates:
- `coalition-dev-assets`
- `coalition-staging-assets`
- `coalition-production-assets`

⚠️ **Warning**: This will fail if someone else already owns these bucket names.

### Option 2: Custom Prefix

Use your own prefix to avoid conflicts:

```hcl
module "serverless_storage" {
  source = "./modules/serverless-storage"
  
  bucket_prefix = "mycompany"  # Creates mycompany-dev-assets-[random], etc.
}

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

### Step 1: Deploy the Buckets

```bash
# Clone the repo
git clone https://github.com/yourorg/coalition-builder

# Deploy the infrastructure
cd terraform
terraform init
terraform apply -target=module.serverless_storage

# Note the bucket names from the output
terraform output serverless_bucket_names
```

### Step 2: Update Configuration

After Terraform creates the buckets, update `backend/zappa_settings.json` with the actual bucket names:

```json
{
  "dev": {
    "environment_variables": {
      "AWS_STORAGE_BUCKET_NAME": "coalition-dev-assets-abc123"
    }
  },
  "staging": {
    "environment_variables": {
      "AWS_STORAGE_BUCKET_NAME": "coalition-staging-assets-def456"
    }
  },
  "production": {
    "environment_variables": {
      "AWS_STORAGE_BUCKET_NAME": "coalition-production-assets-ghi789"
    }
  }
}
```

### Alternative: Use Environment Variables

Instead of hardcoding bucket names, use environment variables:

```python
# In Django settings.py
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
```

Then set the environment variable during deployment:

```bash
export AWS_STORAGE_BUCKET_NAME=$(terraform output -raw serverless_bucket_names | jq -r '.dev')
zappa deploy dev
```