# Networking Module

Terraform module for creating secure, cost-optimized VPC infrastructure for Coalition Builder.

**For complete deployment guide, see: [AWS Deployment Guide](../../../docs/deployment/aws.md)**

## Key Features

- **Cost-Optimized Design**: ECS runs in public subnets with public IPs, eliminating NAT Gateway costs
- **Multi-AZ Subnets**: Public subnets for ALB and ECS, private database subnets for RDS
- **S3 Gateway Endpoint**: Free, efficient access to S3 for all VPC resources
- **Secure Architecture**: ECS tasks protected by security groups, only accessible through ALB

## Quick Start

```hcl
module "networking" {
  source = "./modules/networking"

  prefix     = "coalition"
  aws_region = "us-east-1"
  vpc_cidr   = "10.0.0.0/16"

  create_public_subnets  = true
  create_private_subnets = true
  create_db_subnets      = true
}
```

## Network Architecture

### Subnet Design

The module creates three types of subnets:

1. **Public Subnets** (2 AZs):
   - Used by Application Load Balancer (ALB)
   - Used by ECS Fargate tasks with public IP assignment
   - Direct internet access via Internet Gateway
   - CIDR: 10.0.1.0/24 and 10.0.2.0/24

2. **Private App Subnets** (2 AZs):
   - Currently unused (ECS runs in public subnets)
   - Reserved for future use if needed
   - CIDR: 10.0.3.0/24 and 10.0.4.0/24

3. **Private Database Subnets** (2 AZs):
   - Used by RDS PostgreSQL instances
   - No internet access for maximum security
   - CIDR: 10.0.5.0/24 and 10.0.6.0/24

### S3 Gateway Endpoint

The module creates a free S3 Gateway endpoint that provides:

- Direct, efficient access to S3 without traversing the internet
- No data transfer costs for S3 access
- Available to all subnets in the VPC

### Security Model

- **ECS Tasks**: Run in public subnets with public IPs but are protected by security groups
- **ALB**: Public-facing, handles all incoming traffic
- **Security Groups**: Ensure ECS tasks only accept traffic from ALB
- **Database**: Isolated in private subnets, only accessible from ECS tasks and bastion

## Inputs

See `variables.tf` for a complete list of input parameters.

## Outputs

| Name                       | Description                                 |
| -------------------------- | ------------------------------------------- |
| vpc_id                     | The ID of the VPC                           |
| vpc_cidr                   | The CIDR block of the VPC                   |
| public_subnet_ids          | List of public subnet IDs                   |
| private_subnet_ids         | List of private app subnet IDs              |
| private_db_subnet_ids      | List of private database subnet IDs         |
| app_subnet_cidrs           | List of private app subnet CIDR blocks      |
| db_subnet_cidrs            | List of private database subnet CIDR blocks |
| s3_endpoint_id             | ID of the S3 VPC endpoint                   |
| s3_endpoint_prefix_list_id | Prefix list ID of the S3 VPC endpoint       |

## Complete Documentation

This module is part of the Coalition Builder infrastructure. For:

- **Architecture Overview**: See [AWS Deployment Guide](../../../docs/deployment/aws.md)
- **Full Infrastructure**: See [Terraform README](../../README.md)
- **Project Documentation**: Visit [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)
