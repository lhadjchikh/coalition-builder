# Zappa Module

This Terraform module creates the necessary AWS infrastructure for deploying Django applications to Lambda using Zappa.

## Resources Created

- **S3 Bucket**: For storing Zappa deployment packages
- **IAM Roles**: For Lambda execution and Zappa deployment operations
- **Security Group**: For Lambda VPC access
- **S3 Bucket Policies**: Lifecycle management and versioning

## Usage

```hcl
module "zappa" {
  source = "./modules/zappa"

  prefix     = "coalition-builder"
  aws_region = "us-east-1"
  vpc_id     = module.networking.vpc_id

  database_subnet_cidrs = [
    "10.0.3.0/24",
    "10.0.4.0/24"
  ]

  tags = {
    Environment = "production"
    Application = "coalition-builder"
  }
}
```

## Inputs

| Name                  | Description                      | Type         | Default | Required |
| --------------------- | -------------------------------- | ------------ | ------- | :------: |
| prefix                | Resource name prefix             | string       | n/a     |   yes    |
| aws_region            | AWS region                       | string       | n/a     |   yes    |
| vpc_id                | VPC ID for Lambda security group | string       | n/a     |   yes    |
| database_subnet_cidrs | CIDR blocks for database access  | list(string) | n/a     |   yes    |
| tags                  | Tags to apply to all resources   | map(string)  | {}      |    no    |

## Outputs

| Name                       | Description                                 |
| -------------------------- | ------------------------------------------- |
| s3_bucket_name             | Name of the S3 bucket for Zappa deployments |
| s3_bucket_arn              | ARN of the S3 bucket                        |
| lambda_security_group_id   | ID of the Lambda security group             |
| zappa_deployment_role_arn  | ARN of the IAM role for Zappa deployments   |
| zappa_deployment_role_name | Name of the IAM role                        |

## Features

### S3 Bucket Configuration

- **Versioning**: Enabled for rollback capability
- **Encryption**: Server-side encryption with AES256
- **Public Access**: Blocked for security
- **Lifecycle Policy**: Automatic cleanup of old deployments (30 days)
- **Multipart Uploads**: Automatic cleanup of incomplete uploads

### Lambda Security Group

- **Egress Rules**:
  - Port 5432 to database subnets (PostgreSQL)
  - Port 443 for AWS services (HTTPS)
  - Port 80 for external APIs (HTTP)
  - Port 53 for DNS (UDP)

### IAM Permissions

The Zappa deployment role includes permissions for:

- Lambda function management
- S3 bucket operations
- API Gateway configuration
- CloudWatch logging
- EventBridge rules
- IAM role operations

## Security Considerations

- S3 bucket denies all public access
- Lambda security group follows least privilege principle
- IAM role scoped to specific resource prefixes
- Encryption at rest for S3 objects

## Cost Optimization

- **S3 Lifecycle**: Automatically removes old deployment versions
- **Pay-per-use**: No ongoing costs when Lambda is idle
- **Minimal Resources**: Only essential infrastructure created

## Integration with Zappa

This module creates the infrastructure required by Zappa. In your `zappa_settings.json`:

```json
{
  "production": {
    "s3_bucket": "coalition-builder-zappa-deployments",
    "vpc_config": {
      "SubnetIds": ["subnet-xxx", "subnet-yyy"],
      "SecurityGroupIds": ["sg-from-this-module"]
    }
  }
}
```

The GitHub Actions workflow automatically configures these values during deployment.
