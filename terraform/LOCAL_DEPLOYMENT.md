# Local Terraform Deployment

This guide explains how to deploy the infrastructure locally using Terraform.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (version 1.0+)
3. **AWS Account** with sufficient permissions

## Setup

### 1. Configure Variables

Copy the example file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values. Key items to update:

- **Passwords**: Replace all default passwords with secure ones
- **Django Secret Key**: Generate a new one using:

  ```bash
  python generate-secret-key.py
  ```

- **Domain**: Update `domain_name` and email addresses
- **SSH Key**: Add your public key to `bastion_public_key` for SSH access
- **Route53**: Add `route53_zone_id` if using Route53 for DNS

⚠️ **IMPORTANT**: `terraform.tfvars` contains sensitive data and is gitignored. Never commit it!

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan the Deployment

Review what will be created:

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

## What Gets Created

### Core Infrastructure

- **VPC** with public/private subnets
- **RDS PostgreSQL** instance with PostGIS
- **ECS Cluster** for container deployment
- **Application Load Balancer**
- **S3 Buckets** for static assets

### Security & Secrets (Hybrid Approach)

- **SSM Parameter Store** (FREE):
  - `/coalition/dev/database-url`
  - `/coalition/staging/database-url`
  - `/coalition/prod/database-url`
  - `/coalition/secret-key`
  - `/coalition/site-password`
- **Secrets Manager** ($0.40/month):
  - SES SMTP credentials (complex JSON)

### Optional Components

- **Bastion Host** for SSH access to private resources
- **SES** for email functionality
- **CloudFront** CDN for static assets
- **Budget Alerts** for cost monitoring

## Cost Estimates

With default settings (t3.micro instances):

| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (256 CPU, 512 MB) | ~$11 |
| RDS db.t3.micro | ~$15 |
| Load Balancer | ~$18 |
| NAT Gateway | ~$45 |
| Secrets Manager (1 secret) | $0.40 |
| S3 & CloudFront | ~$1 |
| **Total** | **~$90/month** |

💡 **Cost Optimization Tips**:

- Use `enable_bastion = false` when not needed
- Consider smaller RDS instance for development
- Stop ECS tasks when not in use

## Managing Secrets

### Viewing Current Values

The backup script already saved your existing secrets to `backend/local/`:

```bash
cat backend/local/secrets-backup-latest.json
```

### Migrating to SSM

After deployment, migrate simple secrets to SSM:

```bash
cd backend
poetry run python local/migrate-to-ssm.py --dry-run  # Preview
poetry run python local/migrate-to-ssm.py             # Execute
```

## Accessing Resources

### Database Access via Bastion

1. Get connection info:

   ```bash
   terraform output ssh_tunnel_command
   ```

2. Create SSH tunnel:

   ```bash
   ssh -i coalition-bastion.pem ec2-user@<bastion-ip> -L 5432:<db-endpoint>:5432
   ```

3. Connect with pgAdmin or psql to `localhost:5432`

### Application URLs

After deployment:

```bash
terraform output application_urls
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ **WARNING**: This will delete all data! Back up first.

## Troubleshooting

### Common Issues

1. **"Invalid credentials"**: Ensure AWS CLI is configured
2. **"Resource already exists"**: Check for naming conflicts
3. **"Insufficient permissions"**: Review IAM policies

### Useful Commands

```bash
# Check current state
terraform state list

# Refresh state from AWS
terraform refresh

# Target specific module
terraform apply -target=module.database

# Increase logging
export TF_LOG=DEBUG
terraform apply
```

## Security Notes

1. **Never commit** `terraform.tfvars` or `*.tfstate` files
2. **Use strong passwords** for all database accounts
3. **Rotate credentials** regularly
4. **Enable MFA** on AWS account
5. **Review security groups** regularly

## Files Structure

```
terraform/
├── terraform.tfvars.example  # Template (safe to commit)
├── terraform.tfvars          # Your values (NEVER commit)
├── generate-secret-key.py    # Helper to generate Django secret
├── LOCAL_DEPLOYMENT.md       # This file
└── *.tf                      # Terraform configuration files
```
