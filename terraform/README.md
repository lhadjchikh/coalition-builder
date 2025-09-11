# Terraform Infrastructure for Coalition Builder

[![IaC Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_terraform.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_terraform.yml)
[![Terraform](https://img.shields.io/badge/terraform-1.12+-blue.svg)](https://www.terraform.io/)
[![AWS Provider](https://img.shields.io/badge/aws-5.99+-orange.svg)](https://registry.terraform.io/providers/hashicorp/aws/latest)

This directory contains the Terraform configuration for deploying Coalition Builder's serverless infrastructure to AWS. The infrastructure is designed to be secure, scalable, and cost-optimized with a 46% cost reduction from the previous ECS-based deployment.

## 📚 Documentation

**For complete deployment documentation, visit: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

Quick links:

- [AWS Serverless Guide](../docs/deployment/aws.md) - Complete serverless deployment walkthrough
- [Lambda Deployment](../docs/lambda_deployment.md) - Django on Lambda setup
- [Vercel Deployment](../docs/vercel_deployment.md) - Next.js on Vercel setup
- [Configuration Reference](https://lhadjchikh.github.io/coalition-builder/reference/environment/) - All environment variables
- [Deployment Overview](https://lhadjchikh.github.io/coalition-builder/deployment/) - Multiple deployment options

## Technology Stack

- **Terraform**: Infrastructure as Code (>= 1.12.0)
- **AWS Provider**: ~> 5.99.0
- **AWS Services**: Lambda, API Gateway, RDS PostgreSQL, DynamoDB, S3, Secrets Manager, ECS (TIGER imports only)
- **Testing**: Terratest with AWS SDK Go v2
- **Security**: WAF, Security Groups, KMS encryption

## Project Structure

```
terraform/
├── modules/
│   ├── dynamodb/             # DynamoDB for serverless rate limiting
│   ├── zappa/                # S3 and IAM for Lambda deployment
│   ├── geodata-import/       # ECS for TIGER shapefile processing
│   ├── database/             # RDS PostgreSQL with PostGIS
│   ├── networking/           # VPC, Subnets (existing infrastructure)
│   ├── security/             # Security groups
│   └── ses/                  # Email service configuration
│
│   # Legacy modules (deprecated but kept for reference):
│   ├── compute/              # ECS, ECR, Bastion host
│   ├── loadbalancer/         # ALB, Target groups
│   ├── storage/              # S3, CloudFront CDN
│   └── monitoring/           # CloudWatch alerts
├── scripts/
│   ├── setup_remote_state.sh # Remote state helper
│   └── db_setup.sh           # Database setup
├── tests/                    # Terratest integration tests
│   ├── modules/              # Module-specific tests
│   ├── integration/          # Full-stack tests
│   └── common/               # Test utilities
├── main.tf                   # Main configuration
├── variables.tf              # Input variables
├── outputs.tf                # Output values
└── backend.tf                # Remote state configuration
```

## Serverless Architecture Overview

The infrastructure uses a serverless architecture for cost optimization and scalability:

> **Note**: For complete architecture documentation, see the [AWS Serverless Guide](../docs/deployment/aws.md).

```mermaid
%%{init: {'theme':'basic'}}%%
flowchart TB
    internet[Internet] --> vercel[Vercel Edge Network<br/>Next.js Frontend]
    internet --> apigateway[API Gateway]

    subgraph aws["AWS (us-east-1)"]
        apigateway --> lambda[Lambda Function<br/>Django via Zappa]

        lambda --> rds[(RDS PostgreSQL<br/>with PostGIS)]
        lambda --> dynamodb[(DynamoDB<br/>Rate Limiting)]
        lambda --> s3[S3 Static Assets]

        subgraph ecs_occasional["ECS (Occasional Use)"]
            ecs_task[Fargate Task<br/>TIGER Data Import<br/>2 vCPU, 4GB RAM]
        end

        ecs_task --> rds

        subgraph security["Security & Monitoring"]
            secrets[Secrets Manager]
            cloudwatch[CloudWatch Logs]
            xray[X-Ray Tracing]
        end

        lambda --> secrets
        lambda --> cloudwatch
        lambda --> xray
    end

    vercel --> apigateway
```

### Current: Serverless Benefits

- **46% Cost Reduction**: ~$39/month vs ~$73/month (ECS)
- **Auto-scaling**: Lambda scales to zero when idle
- **Global Performance**: Vercel edge network
- **Minimal Maintenance**: No server management required
- **Pay-per-use**: DynamoDB and Lambda billing

### Infrastructure Components

- **Lambda**: Django API via Zappa (Python 3.13)
- **API Gateway**: REST API with custom domains
- **RDS PostgreSQL**: Database with PostGIS extension
- **DynamoDB**: Serverless rate limiting (replaces Redis)
- **ECS Fargate**: TIGER shapefile imports (occasional use)
- **Vercel**: Next.js frontend with global CDN

### Security Features

- **Network Isolation**: VPC with public and private database subnets
- **Encryption**: KMS encryption for RDS and Secrets Manager
- **Access Control**: IAM roles with least privilege
- **WAF Protection**: Web Application Firewall rules
- **SSH Access**: Secure bastion host for database access
- **Credential Management**: AWS Secrets Manager integration

### Cost Optimization

- **ECS in Public Subnets**: Eliminates NAT Gateway costs (~$45/month savings)
- **S3 Gateway Endpoint**: Free S3 access without data transfer costs
- **Fargate Spot**: Option to use Spot instances for non-critical workloads
- **Auto-scaling**: Automatic scaling based on demand
- **Budget Alerts**: Proactive cost monitoring and alerting

## Quick Start

### Prerequisites

1. **AWS Account**: With appropriate permissions
2. **Terraform**: Version 1.12 or higher
3. **AWS CLI**: Configured with credentials
4. **Domain**: Registered domain with Route53 hosted zone
5. **SSL Certificate**: ACM certificate for HTTPS

### Basic Deployment

```bash
# Clone the repository
git clone https://github.com/lhadjchikh/coalition-builder.git
cd coalition-builder/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars with your configuration
cat > terraform.tfvars <<EOF
aws_region = "us-east-1"
domain_name = "yourdomain.com"
route53_zone_id = "Z1234567890ABC"
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
alert_email = "admin@yourdomain.com"

# Email configuration (AWS SES)
ses_from_email = "noreply@yourdomain.com"
ses_verify_domain = true
ses_notification_email = "admin@yourdomain.com"
EOF

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

## Module Documentation

Each module has its own README with detailed configuration options:

- [Networking](modules/networking/README.md) - VPC and subnet configuration
- [Database](modules/database/README.md) - RDS PostgreSQL with PostGIS
- [Compute](modules/compute/README.md) - ECS Fargate configuration
- [Storage](modules/storage/README.md) - S3 and CloudFront CDN
- [Security](modules/security/README.md) - Security groups and WAF
- [SES](modules/ses/README.md) - Email configuration with AWS SES

## Testing

The infrastructure includes comprehensive tests using Terratest:

```bash
# Run all tests
cd tests
go test -v ./...

# Run specific module tests
go test -v ./modules/networking_test.go

# Run integration tests
go test -v ./integration/
```

## Monitoring and Alerts

The infrastructure includes:

- **CloudWatch Dashboards**: ECS, RDS, and ALB metrics
- **Budget Alerts**: Monthly spending limits
- **Anomaly Detection**: Unusual cost patterns
- **Log Aggregation**: Centralized logging in CloudWatch

## Security Compliance

The infrastructure is designed with security best practices:

- **SOC 2 Ready**: Audit logging and access controls
- **HIPAA Capable**: Encryption at rest and in transit
- **PCI DSS**: Network segmentation and WAF protection
- **GDPR**: Data residency and deletion capabilities

## Cost Estimation

Typical monthly costs for a production deployment:

| Service                   | Configuration                | Estimated Cost |
| ------------------------- | ---------------------------- | -------------- |
| ECS Fargate               | 0.5 vCPU, 1GB RAM            | ~$20           |
| RDS PostgreSQL            | db.t4g.micro                 | ~$15           |
| Application Load Balancer | 1 ALB                        | ~$20           |
| S3 & CloudFront           | 10GB storage, 100GB transfer | ~$10           |
| Route53                   | 1 hosted zone                | ~$0.50         |
| Secrets Manager           | 5 secrets                    | ~$2.50         |
| CloudWatch                | Logs and metrics             | ~$5            |
| **Total**                 |                              | **~$73/month** |

_Note: Actual costs vary based on usage and region._

## Support

For issues, questions, or contributions:

1. Check the [documentation](https://lhadjchikh.github.io/coalition-builder/)
2. Search [existing issues](https://github.com/lhadjchikh/coalition-builder/issues)
3. Open a [new issue](https://github.com/lhadjchikh/coalition-builder/issues/new)

## License

This infrastructure code is part of the Coalition Builder project. See the main [LICENSE](../LICENSE) file for details.
