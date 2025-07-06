# Terraform Infrastructure for Coalition Builder

This directory contains the Terraform configuration for deploying the Coalition Builder application to AWS. The infrastructure is designed to be secure, scalable, and SOC 2 compliant.

## Quick Start

```bash
# 1. Setup remote state (one-time per AWS account)
./scripts/setup_remote_state.sh

# 2. Initialize Terraform with your backend
terraform init -backend-config=backend.hcl

# 3. Plan and apply your infrastructure
terraform plan
terraform apply

# 4. (Optional) Run database setup if not using auto_setup_database
./scripts/db_setup.sh --endpoint $(terraform output -raw database_endpoint)
```

## Key Features

- ✅ **Multi-environment support** with account-specific remote state
- ✅ **Conditional SSR** for cost optimization and flexible deployment
- ✅ **Secure credentials** with AWS Secrets Manager integration
- ✅ **Comprehensive testing** with Terratest and AWS SDK v2
- ✅ **Production-ready** security and monitoring

## Architecture Overview

The infrastructure architecture consists of the following components:

- **Networking**: VPC, subnets, route tables, security groups
- **Compute**: ECS Fargate for containerized application (Django API and optional Next.js SSR)
- **Database**: RDS PostgreSQL with PostGIS extension
- **Load Balancing**: Application Load Balancer with dedicated security group
- **Secrets Management**: AWS Secrets Manager for secure credentials with proper URL encoding
- **Monitoring**: CloudWatch for logs and metrics
- **DNS**: Route53 for domain management

### Figure 1: AWS Infrastructure Architecture

The following diagram shows the complete AWS infrastructure layout:

> **Note**: This diagram uses Mermaid syntax. It will render automatically on GitHub, GitLab, and other platforms that support Mermaid.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    %% Internet
    internet[Internet] --> cloudfront[CloudFront CDN]
    internet --> route53[Route53 DNS]

    %% DNS and CDN
    route53 --> alb[Application Load Balancer]
    cloudfront --> s3_assets[S3 Static Assets]

    %% VPC Container
    subgraph vpc["VPC (10.0.0.0/16)"]
        %% Public Subnets
        subgraph public["Public Subnets"]
            alb
            bastion[Bastion Host]
        end

        %% Private Subnets
        subgraph private["Private Subnets"]
            subgraph ecs_cluster["ECS Cluster"]
                django[Django API Container]
                ssr[Next.js SSR Container<br/>*optional*]
                redis[Redis Cache]
            end
        end

        %% Database Subnets
        subgraph db_subnets["Database Subnets"]
            rds[(RDS PostgreSQL<br/>with PostGIS)]
        end
    end

    %% External Services
    subgraph aws_services["AWS Services"]
        secrets[Secrets Manager]
        ecr[ECR Repositories]
        cloudwatch[CloudWatch Logs]
        s3_assets
    end

    %% Connections
    alb --> django
    alb --> ssr
    django --> redis
    django --> rds
    ssr --> django
    bastion --> rds

    %% CloudFront connections
    cloudfront --> alb

    %% Service connections
    django --> secrets
    ssr --> secrets
    django --> cloudwatch
    ssr --> cloudwatch
    redis --> cloudwatch

    %% ECR
    ecr --> django
    ecr --> ssr
    ecr --> redis
```

_Figure 1: AWS infrastructure showing VPC with public/private/database subnets, ECS Fargate containers, RDS database, and supporting AWS services. CloudFront CDN serves static files from both S3 (user uploads) and Django/WhiteNoise (/static/\* paths). The SSR container is optional and controlled by the `enable_ssr` variable._

## Conditional Server-Side Rendering (SSR)

This infrastructure includes optional Next.js Server-Side Rendering (SSR) capabilities that can be toggled on or off using a single Terraform variable.

### What is SSR?

Server-Side Rendering pre-renders pages on the server before sending them to the client, which can improve:

- **Performance**: Faster initial page loads and time-to-interactive
- **SEO**: Better search engine indexing for content
- **Accessibility**: Content is available even with JavaScript disabled

### Using the SSR Feature

To control the SSR feature, use the `enable_ssr` variable:

```hcl
# Enable SSR (default)
enable_ssr = true

# Disable SSR
enable_ssr = false
```

### Resource Impact

When `enable_ssr = true` (default), the following additional resources are provisioned:

- An additional ECR repository for the SSR container
- Additional ECS task definition container for Next.js SSR
- Additional target group for SSR traffic
- Additional ALB listener rules for the SSR service

When `enable_ssr = false`, these resources are not created, resulting in:

- Lower AWS resource costs (fewer ECS tasks, no SSR container)
- Simpler infrastructure (single-container task)
- Reduced deployment complexity

### When to Disable SSR

Consider disabling SSR in these scenarios:

- **Development/Testing**: When you're working on the backend API only
- **Cost Optimization**: For non-production environments to reduce costs
- **API-Only Mode**: When your application is being used primarily as an API
- **Static Site Generation**: When using Next.js Export/Static Generation instead

### Implementation Details

The SSR implementation uses Terraform's conditional resource creation:

```hcl
# Example: Conditional ECR repository
resource "aws_ecr_repository" "ssr" {
  count = var.enable_ssr ? 1 : 0
  name  = "${var.prefix}-ssr"
  # ...other configuration
}

# Example: Conditional container in task definition
dynamic "container_definitions" {
  for_each = var.enable_ssr ? [1] : []
  content {
    name  = "ssr"
    image = "${aws_ecr_repository.ssr[0].repository_url}:latest"
    # ...other configuration
  }
}
```

## Security Architecture

The infrastructure implements a layered security model with separate security groups for each component:

### Security Groups

- **Load Balancer Security Group**: Allows HTTP/HTTPS (80/443) from internet, sends traffic to application on port 8000
- **Application Security Group**: Accepts traffic from load balancer on port 8000, connects to database on port 5432
- **Database Security Group**: Accepts connections from application and bastion host on port 5432
- **Bastion Security Group**: Allows SSH (22) from specified IP ranges

This separation ensures each component has only the minimum required network access (principle of least privilege).

## Flexible Deployment Options

The infrastructure is designed to be flexible and adaptable to different deployment scenarios:

### New Infrastructure Deployment

By default, the Terraform configuration creates all required resources from scratch, including:

- New VPC with public and private subnets
- Security groups, route tables, and internet gateways
- RDS database instance
- ECS cluster and services

### Using Existing VPC Resources

The infrastructure can also be deployed into an existing VPC environment by setting the appropriate variables:

- Use an existing VPC and create new subnets
- Use an existing VPC with existing subnets
- Mix and match by using some existing resources and creating others

This flexibility makes it ideal for enterprise environments where network infrastructure may already be established.

## Database Setup Process

The database setup has been improved for better reliability and security:

### Automated Setup (Recommended)

- Uses a robust shell script (`db_setup.sh`) with proper error handling
- Implements secure password URL encoding with fallback methods
- Validates prerequisites before execution
- Provides clear error messages and recovery instructions

### Manual Setup (Alternative)

- Run the setup script manually after Terraform deployment
- Full control over the setup process
- Better for troubleshooting and custom environments

## Security Features

The infrastructure includes the following security features:

- **AWS Secrets Manager** for secure credential storage with proper URL encoding
- **Secure credential generation** for database users with URL-safe characters
- **IAM roles with least privilege** for all services
- **KMS encryption** for sensitive data
- **Layered security groups** with component isolation
- **Network isolation** for database resources
- **Application-level separation of privileges**
- **WAF protection** for web applications

## Secure Credentials Management

### Database Credentials

Database credentials are managed securely through AWS Secrets Manager:

1. **Master Database User**: Administrative user with full database privileges
   - Credentials stored in AWS Secrets Manager
   - Used only for initial setup and maintenance
   - Not exposed to application code

2. **Application Database User**: Restricted user for application access
   - Automatically generated secure, URL-safe password
   - Limited privileges based on principle of least privilege
   - Credentials injected into application via Secrets Manager
   - Proper URL encoding to handle special characters in connection strings

### Credential Lifecycle

1. **Initial Setup**:
   - If secrets don't exist, they are created with secure passwords
   - If secrets exist, they are used for deployment
   - Database setup script handles both scenarios gracefully

2. **Manual Password Updates**:
   - Passwords can be updated manually through AWS Secrets Manager console
   - No need to update Terraform configuration
   - Re-run database setup script to sync changes

3. **Future Enhancement**:
   - Automated password rotation is not currently configured
   - May be implemented in future releases using AWS Lambda and Secrets Manager rotation schedules

4. **Access Control**:
   - IAM policies restrict access to secrets
   - KMS encryption adds another layer of security
   - Audit logging tracks all access to secrets

## Database Setup Script

The infrastructure includes an improved database setup script (`db_setup.sh`) with the following features:

### Features

- **Robust error handling**: Validates prerequisites and provides clear error messages
- **Secure password handling**: Generates URL-safe passwords and handles encoding properly
- **Multiple execution methods**: Direct PostgreSQL variables or file-based with safe substitution
- **Cross-platform compatibility**: Works on various operating systems
- **Detailed logging**: Color-coded output and progress indicators

### Prerequisites

- Python3 (for secure password URL encoding)
- AWS CLI (properly configured with appropriate permissions)
- PostgreSQL client (`psql`)
- OpenSSL (for password generation)

### Usage

```bash
# Basic usage
./scripts/db_setup.sh --endpoint your-rds-endpoint.amazonaws.com

# Full options
./scripts/db_setup.sh --endpoint your-rds-endpoint.amazonaws.com \
              --database myapp \
              --master-user admin \
              --app-user app_service \
              --prefix myapp \
              --region us-east-1
```

## Using Secrets Manager

### For Initial Deployment

For the initial deployment, you have two options:

1. **Pre-create secrets** (recommended for production):

   ```bash
   # Create master credentials secret
   aws secretsmanager create-secret \
     --name coalition/database-master \
     --description "PostgreSQL master database credentials" \
     --secret-string '{"username":"your_secure_username","password":"your_secure_password"}'

   # Optional: Create application credentials secret
   aws secretsmanager create-secret \
     --name coalition/database-app \
     --description "PostgreSQL application database credentials" \
     --secret-string '{"username":"app_user","password":"your_secure_app_password"}'
   ```

2. **Let the setup script create secrets** (development/testing):
   - Run Terraform to create infrastructure
   - Run the database setup script which will create and populate secrets
   - Script generates secure, URL-safe passwords automatically

### Accessing Secrets

To view the secrets:

```bash
# View master credentials
aws secretsmanager get-secret-value --secret-id coalition/database-master --query SecretString --output text | jq .

# View application credentials
aws secretsmanager get-secret-value --secret-id coalition/database-app --query SecretString --output text | jq .

# Get just the application password
aws secretsmanager get-secret-value --secret-id coalition/database-url --query SecretString --output text | jq -r .password
```

## Bastion Host SSH Key Management

A bastion host is provisioned to allow secure access to the database. You have several options for SSH key management.

### Option 1: Manual Key Pair Creation (Recommended for Production)

1. Create an SSH key pair locally:

   ```bash
   ssh-keygen -t rsa -b 2048 -f ~/.ssh/coalition-bastion -C "coalition-bastion"
   ```

2. Store the public key as a GitHub secret with the name `TF_VAR_BASTION_PUBLIC_KEY`.
   - Copy the contents of `~/.ssh/coalition-bastion.pub`
   - Go to your GitHub repository → Settings → Secrets and Variables → Actions
   - Add new repository secret with name `TF_VAR_BASTION_PUBLIC_KEY` and paste the public key as value

3. Keep the private key (`~/.ssh/coalition-bastion`) secure for connecting to the bastion host.

4. To connect to the bastion host:
   ```bash
   ssh -i ~/.ssh/coalition-bastion ec2-user@<bastion-host-public-ip>
   ```

### Option 2: Using an AWS-Managed Key Pair

Instead of providing your own public key, you can have AWS create and manage the key pair:

1. Create a key pair in the AWS Console:
   - Go to EC2 → Key Pairs → Create Key Pair
   - Name it `coalition-bastion` (or whatever name you prefer)
   - Select RSA and .pem format
   - Download and save the private key file securely

2. In your Terraform configuration, set:

   ```hcl
   bastion_key_name = "coalition-bastion"  # Must match the name you used in AWS Console
   bastion_public_key = ""                  # Leave empty to use existing key
   ```

3. The infrastructure will use this key pair for the bastion host.

> **Note**: By default, the infrastructure assumes that key pairs already exist in AWS and won't try to create them. To create a new key pair, you must:
>
> 1. Set `create_new_key_pair = true`
> 2. Provide a value for `bastion_public_key` (required when `create_new_key_pair = true`)
>
> If `create_new_key_pair = true` but no `bastion_public_key` is provided, the deployment will fail with an error message. This approach prevents conflicts when the key pair already exists in AWS.

4. Connect using the private key you downloaded:
   ```bash
   ssh -i /path/to/coalition-bastion.pem ec2-user@<bastion-host-public-ip>
   ```

> **Note**: The key difference between Option 1 and Option 2 is who creates and manages the key pair. With Option 1, you create the key pair locally and provide the public key to Terraform. With Option 2, AWS creates and manages the key pair, and you only need to download the private key.

### SSH Tunnel for Database Access

To access the RDS database through the bastion host:

1. Create an SSH tunnel:

   ```bash
   ssh -i ~/.ssh/coalition-bastion -L 5432:your-rds-endpoint:5432 ec2-user@<bastion-host-public-ip>
   ```

2. Connect to the database using localhost:5432 in your SQL client.

## Core Variables

| Variable Name        | Description                            | Default                                                 | Required                |
| -------------------- | -------------------------------------- | ------------------------------------------------------- | ----------------------- |
| `prefix`             | Prefix to use for resource names       | `coalition`                                             | No                      |
| `aws_region`         | AWS region to deploy to                | `us-east-1`                                             | No                      |
| `tags`               | Default tags to apply to all resources | `{ Project = "coalition", Environment = "Production" }` | No                      |
| `bastion_key_name`   | SSH key name for bastion host          | `coalition-bastion`                                     | No                      |
| `bastion_public_key` | SSH public key for bastion host        | `""`                                                    | Yes, for bastion access |
| `enable_ssr`         | Enable Server-Side Rendering           | `true`                                                  | No                      |

## Networking Variables

| Variable Name                | Description                                                                | Default | Required                                  |
| ---------------------------- | -------------------------------------------------------------------------- | ------- | ----------------------------------------- |
| `create_vpc`                 | Whether to create a new VPC                                                | `true`  | No                                        |
| `vpc_id`                     | ID of existing VPC (if `create_vpc` is false)                              | `""`    | Yes, if `create_vpc` is false             |
| `create_public_subnets`      | Whether to create new public subnets                                       | `true`  | No                                        |
| `public_subnet_ids`          | IDs of existing public subnets (if `create_public_subnets` is false)       | `[]`    | Yes, if `create_public_subnets` is false  |
| `create_private_subnets`     | Whether to create new private app subnets                                  | `true`  | No                                        |
| `private_subnet_ids`         | IDs of existing private app subnets (if `create_private_subnets` is false) | `[]`    | Yes, if `create_private_subnets` is false |
| `create_db_subnets`          | Whether to create new database subnets                                     | `true`  | No                                        |
| `db_subnet_ids`              | IDs of existing database subnets (if `create_db_subnets` is false)         | `[]`    | Yes, if `create_db_subnets` is false      |
| `enable_single_az_endpoints` | Deploy VPC endpoints in single AZ to reduce costs (~50% savings)           | `true`  | No                                        |

## Database Variables

| Variable Name         | Description                                             | Default          | Required                    |
| --------------------- | ------------------------------------------------------- | ---------------- | --------------------------- |
| `use_secrets_manager` | Enable AWS Secrets Manager integration                  | `true`           | No                          |
| `db_username`         | Master database username (used only for initial setup)  | `postgres_admin` | No                          |
| `db_password`         | Master database password (used only for initial setup)  | n/a              | Yes, for initial setup only |
| `app_db_username`     | Application database username                           | `app_user`       | No                          |
| `app_db_password`     | Application database password (auto-generated if empty) | `""`             | No                          |
| `db_name`             | Database name                                           | `coalition`      | No                          |
| `auto_setup_database` | Whether to automatically run database setup             | `false`          | No                          |

## Usage Examples

### Default Deployment (Create All Resources)

```hcl
# No special configuration needed - defaults create everything
module "infrastructure" {
  source = "./terraform"

  # Only required variables
  db_password         = "your-secure-password"
  route53_zone_id     = "Z1234567890ABC"
  domain_name         = "mydomain.org"
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/uuid"
  alert_email         = "alerts@example.com"
}
```

### API-Only Deployment (Disable SSR)

```hcl
module "infrastructure" {
  source = "./terraform"

  # Disable Server-Side Rendering
  enable_ssr = false

  # Required variables
  db_password         = "your-secure-password"
  route53_zone_id     = "Z1234567890ABC"
  domain_name         = "mydomain.org"
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/uuid"
  alert_email         = "alerts@example.com"
}
```

### Automated Database Setup

```hcl
module "infrastructure" {
  source = "./terraform"

  # Enable automated database setup
  auto_setup_database = true

  # Required variables
  db_password         = "your-secure-password"
  route53_zone_id     = "Z1234567890ABC"
  domain_name         = "mydomain.org"
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/uuid"
  alert_email         = "alerts@example.com"
}
```

### Using Existing VPC

```hcl
module "infrastructure" {
  source = "./terraform"

  # VPC configuration
  create_vpc = false
  vpc_id     = "vpc-01234567890abcdef"

  # Create new subnets in the existing VPC
  create_public_subnets  = true
  create_private_subnets = true
  create_db_subnets      = true

  # Bastion host configuration
  bastion_key_name    = "coalition-bastion"
  bastion_public_key  = "ssh-rsa AAAAB3NzaC1yc2EAAAAD... coalition-bastion-key" # Your actual public key
  create_new_key_pair = true  # Set to true to create a new key pair, false to use existing

  # Required variables
  db_password         = "your-secure-password"
  route53_zone_id     = "Z1234567890ABC"
  domain_name         = "mydomain.org"
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/uuid"
  alert_email         = "alerts@example.com"
}
```

### Using Existing VPC and Subnets

```hcl
module "infrastructure" {
  source = "./terraform"

  # VPC configuration
  create_vpc = false
  vpc_id     = "vpc-01234567890abcdef"

  # Public subnet configuration
  create_public_subnets = false
  public_subnet_ids     = ["subnet-pub1", "subnet-pub2"]

  # Private subnet configuration
  create_private_subnets = false
  private_subnet_ids     = ["subnet-priv1", "subnet-priv2"]

  # DB subnet configuration
  create_db_subnets = false
  db_subnet_ids     = ["subnet-db1", "subnet-db2"]

  # Required variables
  db_password         = "your-secure-password"
  route53_zone_id     = "Z1234567890ABC"
  domain_name         = "mydomain.org"
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/uuid"
  alert_email         = "alerts@example.com"
}
```

### Complete Configuration with Environment-Specific Settings

```hcl
module "infrastructure" {
  source = "./terraform"

  # Resource naming
  prefix = "coalition-${var.environment}"

  # Environment-specific settings
  tags = {
    Project     = "coalition"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # SSR configuration - enable in prod, disable in dev/staging
  enable_ssr = var.environment == "prod" ? true : false

  # Database configuration
  db_name             = "coalition_${var.environment}"
  auto_setup_database = var.environment != "prod" # Auto setup except in production

  # Security configuration
  allowed_bastion_cidrs = var.environment == "prod" ? ["10.0.0.0/8"] : ["0.0.0.0/0"]

  # Scaling configuration (adjust based on environment)
  desired_count = var.environment == "prod" ? 2 : 1

  # Required variables
  db_password         = var.db_password
  route53_zone_id     = var.route53_zone_id
  domain_name         = "${var.environment == "prod" ? "" : "${var.environment}."}mydomain.org"
  acm_certificate_arn = var.acm_certificate_arn
  alert_email         = var.alert_email
}
```

## Remote State Setup

This Terraform configuration uses remote state storage in S3 with DynamoDB locking for team collaboration and state consistency.

### Initial Setup

1. **Run the setup script** to create your account-specific remote state resources:

   ```bash
   cd terraform
   ./scripts/setup_remote_state.sh
   ```

   This script will:
   - Create a unique S3 bucket: `coalition-terraform-state-{YOUR_AWS_ACCOUNT_ID}`
   - Create a DynamoDB table: `coalition-terraform-locks`
   - Generate a `backend.hcl` file with your account-specific configuration

2. **Initialize Terraform** with the remote backend:

   ```bash
   terraform init -backend-config=backend.hcl
   ```

### For Reusable Infrastructure

This setup ensures that:

- ✅ **Each AWS account gets its own unique bucket** (no naming conflicts)
- ✅ **No account-specific values** are committed to the repository
- ✅ **Team members can share the same code** with their own backends
- ✅ **CI/CD pipelines work** across different environments

### Backend Configuration Files

The repository includes:

- `backend.tf` - Partial backend configuration (version controlled)
- `backend.hcl.example` - Template for users (version controlled)
- `backend.hcl` - Your account-specific config (automatically generated, gitignored)

**Important**: Never commit `backend.hcl` to version control as it contains account-specific information.

### State File Management

The setup includes automatic cleanup for test state files:

- **Production state**: `production/terraform.tfstate` (permanent)
- **Test states**: `tests/terraform-{run-id}.tfstate` (temporary)
- **Automatic cleanup**: S3 lifecycle policy deletes test states after 7 days
- **Immediate cleanup**: GitHub workflows delete their state files after test completion

This approach ensures:

- ✅ **No state conflicts** between production and tests
- ✅ **Parallel test execution** with unique state files per run
- ✅ **Automatic cleanup** prevents storage cost accumulation
- ✅ **Shared bucket** reduces infrastructure complexity

### State File Structure

```
coalition-terraform-state-{ACCOUNT_ID}/
├── production/
│   └── terraform.tfstate                # Production (permanent)
├── tests/
│   ├── terraform-123456-0.tfstate      # Test run 1, job 0 (7-day TTL)
│   ├── terraform-123456-1.tfstate      # Test run 1, job 1 (7-day TTL)
│   └── terraform-789012-0.tfstate      # Test run 2, job 0 (7-day TTL)
```

## Deployment Workflows

### Automated Deployment (Recommended for Development)

```bash
# Option 1: Use terraform.tfvars file
# Create or update terraform.tfvars (safely)
if [ -f terraform.tfvars ] && grep -q "^auto_setup_database" terraform.tfvars; then
  # Update existing variable
  sed -i.bak 's/^auto_setup_database.*/auto_setup_database = true/' terraform.tfvars
else
  # Add new variable (safe append)
  echo 'auto_setup_database = true' >> terraform.tfvars
fi

# Deploy everything at once
terraform apply

# Option 2: Use command-line variable (recommended for CI/CD)
terraform apply -var="auto_setup_database=true"

# Database setup runs automatically
# ✅ Done!
```

### Manual Deployment (Recommended for Production)

```bash
# Option 1: Use terraform.tfvars
# Ensure manual setup in terraform.tfvars
if grep -q "^auto_setup_database" terraform.tfvars; then
  sed -i.bak 's/^auto_setup_database.*/auto_setup_database = false/' terraform.tfvars
else
  echo 'auto_setup_database = false' >> terraform.tfvars
fi

# Deploy infrastructure first
terraform apply

# Option 2: Use command-line variable
terraform apply -var="auto_setup_database=false"

# Run database setup manually with full control
./scripts/db_setup.sh --endpoint $(terraform output -raw database_endpoint)

# You'll be prompted for the master password
# ✅ Done!
```

### CI/CD Pipeline Deployment

```bash
# Method 1: Environment-specific tfvars files
# dev.tfvars
auto_setup_database = true
enable_ssr = true  # Development with SSR enabled

# staging.tfvars
auto_setup_database = true
enable_ssr = false  # Staging with SSR disabled for cost savings

# prod.tfvars
auto_setup_database = false
enable_ssr = true  # Production with full SSR enabled

# Deploy with specific file
terraform apply -var-file="dev.tfvars"
terraform apply -var-file="staging.tfvars"
terraform apply -var-file="prod.tfvars"

# Method 2: Command-line overrides (safest)
# Development with SSR
terraform apply -var="auto_setup_database=true" -var="enable_ssr=true"

# Staging without SSR (API-only mode)
terraform apply -var="auto_setup_database=true" -var="enable_ssr=false"

# Production with SSR
terraform apply -var="auto_setup_database=false" -var="enable_ssr=true"
if [ $? -eq 0 ]; then
  # Run database setup in controlled environment
  $(terraform output -raw database_setup_command)
fi

# ✅ Done with full logging and error handling
```

## Configuration Management

### Preventing Configuration Drift

To prevent ALLOWED_HOSTS issues that can cause health check failures, this project uses a centralized configuration approach:

1. **Environment Configuration File**: Use `.env.example` as a template
   - Copy to `.env` for local development
   - Contains both Django and Terraform variables
   - Ensures consistency between docker-compose and terraform

2. **Shared Variables**: Key configurations are defined once and referenced everywhere

   ```bash
   # In .env.example
   ALLOWED_HOSTS=localhost,127.0.0.1,${TF_VAR_domain_name:-coalition.org},*.${TF_VAR_domain_name:-coalition.org}
   TF_VAR_allowed_hosts=${ALLOWED_HOSTS}
   ```

3. **Simple Validation**: Health check test in CI workflow catches configuration issues

4. **Docker Compose Integration**: Uses environment variables from .env

   ```yaml
   environment:
     - ALLOWED_HOSTS=${ALLOWED_HOSTS:-localhost,127.0.0.1,api,ssr,nginx}
   ```

5. **Terraform Integration**: Uses TF*VAR* variables from .env
   ```hcl
   variable "allowed_hosts" {
     description = "Django ALLOWED_HOSTS setting - should include localhost for health checks"
   }
   variable "csrf_trusted_origins" {
     description = "Django CSRF_TRUSTED_ORIGINS setting"
   }
   ```

### Usage

1. **Setup**: Copy `.env.example` to `.env` and configure your values
2. **Development**: Run `docker-compose up` (uses .env automatically)
3. **Deployment**: Run `terraform apply` (uses TF*VAR* from .env)

### Health Check Endpoints

The application uses different health check endpoints for different services:

- **Django API**: `/health/` (with trailing slash) - Used by the load balancer API target group
- **Next.js SSR**: `/health` (without trailing slash) - Used by the load balancer SSR target group

These different endpoints are intentional and serve different purposes. Do not attempt to standardize them as they correspond to different frameworks' conventions.

## Best Practices

### General

1. **Never hardcode credentials** in Terraform files or environment variables
2. **Use remote state storage** for production deployments
3. **Use Terraform workspaces** for different environments
4. **Validate prerequisites** before running deployments

### Server-Side Rendering (SSR)

1. **Environment-specific SSR settings**: Enable SSR in production for SEO benefits, disable in development/testing for faster iterations
2. **Resource optimization**: Disable SSR in environments where it's not needed to reduce costs
3. **Feature parity testing**: Periodically test with both SSR enabled and disabled to ensure functionality works in both modes
4. **Performance monitoring**: When using SSR, monitor Node.js performance metrics separately from API metrics
5. **Automatic failover**: Consider implementing client-side fallback rendering for resilience

### Security

1. **Use Secrets Manager** for all production deployments
2. **Update credentials** manually through AWS Secrets Manager when needed
3. **Limit access** to the secrets using IAM policies
4. **Monitor access** to secrets through CloudTrail
5. **Use encrypted communications** for all database connections
6. **Store SSH keys securely** and never commit private keys to repositories
7. **Store public keys as secrets** in your CI/CD platform rather than in code
8. **Rotate SSH keys periodically** for enhanced security
9. **Use separate security groups** for each component (load balancer, application, database)

### Database Management

1. **Run database setup script** after infrastructure deployment
2. **Validate password encoding** for special characters
3. **Use URL-safe passwords** to avoid connection string issues
4. **Test database connectivity** through bastion host
5. **Monitor database performance** and adjust instance sizes as needed

### Networking

1. **Evaluate existing VPC** resources before creating new ones
2. **Use private subnets** for applications where possible
3. **Isolate database subnets** from direct internet access
4. **Use bastion hosts** for controlled access to private resources
5. **Limit bastion host access** to specific IP addresses when possible
6. **Implement proper security group rules** following least privilege principle

### Cost Optimization

1. **VPC Endpoints**: Single-AZ deployment reduces costs by ~50%
   - Default configuration uses single-AZ endpoints (saves ~$0.96/day)
   - For high availability, set `enable_single_az_endpoints = false` in production
   - Monitor AZ failures and have a recovery plan

2. **No NAT Gateway**: Architecture avoids expensive NAT Gateways
   - Saves ~$3/day ($90/month) compared to multi-AZ NAT
   - Uses VPC endpoints for AWS service access instead
   - Trade-off: More endpoints to manage, but still cheaper overall

3. **Database Optimization**:
   - Single-AZ RDS deployment (Multi-AZ disabled)
   - Performance Insights disabled
   - Consider stopping database during development downtime

4. **Daily Cost Breakdown** (approximate):
   - VPC Endpoints (single-AZ): ~$0.96/day
   - Application Load Balancer: ~$0.60/day
   - RDS t4g.micro: ~$0.50/day
   - CloudFront CDN: ~$0.01-0.10/day (varies by usage)
   - ECS Fargate: Variable based on usage
   - Total baseline: ~$2.50-3.50/day

5. **Cost Monitoring and Alerts**:
   - Monthly budget alerts at 70%, 90%, and 100% forecast
   - Cost anomaly detection for unusual spending patterns
   - Daily anomaly alerts for changes >= $5 impact
   - Email notifications to configured alert address

## Terraform Outputs

After deployment, the following outputs are available for integration with external systems:

### **Access Outputs**

- `website_url` - Primary application URL
- `load_balancer_dns` - Load balancer DNS name for direct access
- `bastion_public_ip` - Bastion host IP for secure database access

### **Infrastructure Outputs**

- `vpc_id` - VPC identifier for network configurations
- `public_subnet_ids` - Public subnet IDs for load balancer placement
- `private_subnet_ids` - Private subnet IDs for application deployment
- `database_endpoint` - RDS endpoint for application configuration
- `api_ecr_repository_url` - ECR repository URL for API container images
- `ssr_ecr_repository_url` - ECR repository URL for SSR container images

### **Static Assets & CDN Outputs**

- `static_assets_bucket_name` - S3 bucket name for static asset uploads
- `static_assets_bucket_arn` - S3 bucket ARN for IAM policies
- `cloudfront_distribution_domain_name` - CloudFront CDN domain for global asset delivery
- `cloudfront_distribution_id` - CloudFront distribution ID for cache invalidation

### **Cost Monitoring Outputs**

- `cost_anomaly_monitor_arn` - ARN of the Cost Explorer anomaly monitor for programmatic access
- `cost_anomaly_subscription_arn` - ARN of the anomaly subscription for management operations
- `budget_alerts_sns_topic_arn` - SNS topic ARN for budget alerts integration
- `cost_anomaly_sns_topic_arn` - SNS topic ARN for anomaly alerts integration

### **Usage Examples**

```bash
# Get cost monitoring SNS topic for external integration
terraform output cost_anomaly_sns_topic_arn

# Get database endpoint for application configuration
terraform output database_endpoint

# Get all outputs in JSON format
terraform output -json
```

### Troubleshooting

1. **Check prerequisite tools** (Python3, AWS CLI, psql) before deployment
2. **Review Terraform logs** for detailed error information
3. **Test database connectivity** manually if automated setup fails
4. **Verify AWS permissions** for Secrets Manager and RDS operations
5. **Use manual database setup** for debugging complex issues

## Common Issues and Solutions

### Server-Side Rendering (SSR) Issues

**Problem**: Terraform error when updating from SSR-enabled to SSR-disabled

```
Error: cannot destroy a previously created resource
```

**Solution**:

- First, remove the SSR containers from the task definition:
  ```bash
  aws ecs update-service --cluster coalition-cluster --service coalition-service --task-definition coalition-task-definition:LATEST --force-new-deployment
  ```
- Wait for deployment to complete, then run Terraform again
- Consider using separate environments for SSR and non-SSR deployments

**Problem**: SSR container fails health checks

```
HealthCheckFailure: container health check failed
```

**Solution**:

- Verify the healthcheck.ts file exists and has correct permissions
- Check container logs for startup errors:
  ```bash
  aws logs get-log-events --log-group-name /ecs/coalition-task --log-stream-name ssr/latest
  ```
- Ensure the NEXT_PUBLIC_API_URL and API_URL environment variables are correctly set

**Problem**: Load balancer not routing to SSR container

```
404 errors when accessing frontend routes
```

**Solution**:

- Check that the SSR target group has the correct health check path (`/health`)
- Check that the API target group has the correct health check path (`/health/`)
- Verify the load balancer listener rules are routing frontend paths to the SSR target group
- Ensure the SSR container is exposing port 3000

### Database Setup Issues

**Problem**: Database setup fails with URL encoding errors

```
ERROR: Failed to URL encode password using Python3
```

**Solution**:

- Ensure Python3 is installed and available in PATH
- Regenerate password with only URL-safe characters
- Use manual database setup for full control

**Problem**: PostgreSQL client not found

```
ERROR: psql command not found
```

**Solutions**:

- **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
- **CentOS/RHEL**: `sudo yum install postgresql`
- **macOS**: `brew install postgresql`

**Problem**: AWS CLI not configured properly

```
ERROR: AWS CLI is not properly configured or lacks permissions
```

**Solution**:

- Run `aws configure` to set up credentials
- Ensure IAM user has permissions for:
  - Secrets Manager (GetSecretValue, UpdateSecret, CreateSecret)
  - RDS (DescribeDBInstances)
  - KMS (Decrypt, DescribeKey)

### Terraform Issues

**Problem**: Security group unused variable warning

```
Warning: variable "app_security_group_id" is declared but not used
```

**Solution**: This is resolved in the updated configuration. The load balancer now uses its own dedicated security group (`alb_security_group_id`) instead of the application security group.

**Problem**: null_resource fails with script not found

```
ERROR: db_setup.sh not found
```

**Solution**: Ensure the `db_setup.sh` script is in the same directory as your main Terraform files and is executable:

```bash
chmod +x db_setup.sh
```

### Network Connectivity Issues

**Problem**: Cannot connect to RDS through bastion host

```
Connection timeout when accessing database
```

**Solutions**:

1. Verify security groups allow traffic:
   - Bastion SG allows SSH (22) from your IP
   - Database SG allows PostgreSQL (5432) from bastion SG
2. Check SSH tunnel command:
   ```bash
   ssh -i key.pem ec2-user@bastion-ip -L 5432:db-endpoint:5432
   ```
3. Verify RDS instance is in "available" state

**Problem**: Load balancer cannot reach application containers

```
502 Bad Gateway errors from load balancer
```

**Solution**: Ensure security groups are properly configured:

- ALB security group can send traffic to app on port 8000
- App security group accepts traffic from ALB security group on port 8000

## Testing Framework

The infrastructure includes a comprehensive testing suite built with Go and Terratest:

```
terraform/
├── tests/
│   ├── common/
│   │   └── test_helpers.go          # AWS SDK v2 test utilities
│   ├── modules/
│   │   ├── networking_test.go       # VPC, subnets, routing tests
│   │   ├── compute_test.go          # ECS, ECR, bastion tests
│   │   ├── security_test.go         # Security groups, WAF tests
│   │   └── database_test.go         # RDS, parameter groups tests
│   ├── integration/
│   │   └── full_stack_test.go       # End-to-end infrastructure tests
│   ├── go.mod                       # Go dependencies (SDK v2)
│   ├── go.sum                       # Dependency checksums
│   ├── Makefile                     # Test runner commands
│   └── README.md                    # Testing documentation
```

### Running Tests

#### Quick Validation (No AWS Resources)

```bash
cd terraform/tests
go test -short ./...    # Validates test logic, no AWS costs
```

#### Local Development Testing

```bash
# Test individual modules with AWS resources
make test-networking    # Test VPC, subnets (~$1, 15 min)
make test-compute      # Test ECS, ECR (~$1, 20 min)
make test-security     # Test security groups (~$1, 10 min)
make test-database     # Test RDS (~$1, 20 min)

# Run all module tests (~$4, 30-45 min)
make test-unit
```

#### Full Integration Testing

```bash
# Creates complete infrastructure (~$3-5, 45 min)
make test-integration
```

**📖 See [tests/README.md](tests/README.md) for comprehensive testing documentation including:**

- Local test setup and configuration
- Cost optimization strategies
- Debugging failed tests
- Test patterns and best practices
- CI/CD integration
- AWS permissions required

### Project Structure

```text
terraform/
├── backend.hcl.example           # Example backend configuration
├── backend.tf                    # Remote state configuration
├── main.tf                       # Main Terraform configuration
├── variables.tf                  # Input variables
├── outputs.tf                    # Output values
├── versions.tf                   # Provider version constraints
├── scripts/
│   ├── db_setup.sh               # Database setup script
│   └── setup_remote_state.sh     # Remote state helper
├── modules/
│   ├── compute/                  # ECS, ECR, Bastion host
│   ├── database/                 # RDS, Parameter groups
│   ├── dns/                      # Route53 records
│   ├── loadbalancer/             # ALB, Target groups,
│   ├── monitoring/               # CloudWatch, S3 logs,
│   ├── networking/               # VPC, Subnets, Route
│   ├── secrets/                  # Secrets Manager, KMS
│   └── security/                 # Security groups, WAF
└── terraform.tfvars
```

## Security Considerations

### Production Deployment Checklist

- [ ] **Secrets Management**: All credentials stored in AWS Secrets Manager
- [ ] **Network Security**: Proper security group rules implemented
- [ ] **Encryption**: KMS encryption enabled for RDS and Secrets Manager
- [ ] **Access Control**: IAM roles follow least privilege principle
- [ ] **Monitoring**: CloudWatch logging and budget alerts configured
- [ ] **Backup**: RDS automated backups enabled (14-day retention)
- [ ] **SSH Keys**: Secure key management for bastion host access
- [ ] **WAF**: Web Application Firewall rules active
- [ ] **Database Access**: No direct internet access to database

### Security Group Rules Summary

| Component         | Inbound                      | Outbound                             | Purpose                 |
| ----------------- | ---------------------------- | ------------------------------------ | ----------------------- |
| **Load Balancer** | 80,443 from 0.0.0.0/0        | 8000 to App SG                       | Internet → ALB → App    |
| **Application**   | 8000 from ALB SG             | 5432 to DB SG, 80,443 to 0.0.0.0/0   | ALB → App → DB/Internet |
| **Database**      | 5432 from App SG, Bastion SG | Return traffic to App SG, Bastion SG | App/Bastion → DB        |
| **Bastion**       | 22 from specified CIDRs      | All traffic to 0.0.0.0/0             | Admin SSH access        |

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Review CloudWatch logs and metrics
2. **Quarterly**: Update Terraform provider versions
3. **Bi-annually**: Rotate SSH keys and database passwords
4. **Annually**: Review and update security group rules

### Getting Help

1. **Terraform Issues**: Check Terraform plan output and state files
2. **AWS Issues**: Review CloudWatch logs and AWS service health
3. **Database Issues**: Use bastion host for direct troubleshooting
4. **Security Issues**: Review WAF logs and security group rules

### Testing the Infrastructure

The infrastructure includes comprehensive tests using Terratest and AWS SDK Go v2:

```bash
# Run all tests (creates real AWS resources)
cd terraform/tests
go test ./...

# Run tests without creating AWS resources
go test -short ./...

# Run specific module tests
go test -v ./modules/networking_test.go
go test -v ./modules/compute_test.go
go test -v ./modules/security_test.go

# Run integration tests
go test -v ./integration/
```

**Test Features:**

- AWS SDK Go v2 integration for modern, efficient API calls
- Comprehensive unit tests for each Terraform module
- Integration tests for full stack deployments
- Automatic resource cleanup after tests
- Context-based API calls with proper timeout handling
- Type-safe AWS resource validation

See `terraform/tests/README.md` for detailed testing documentation.

### Version Information

**Infrastructure:**

- **Terraform**: >= 1.12.0
- **AWS Provider**: ~> 5.99.0
- **PostgreSQL**: 16.9
- **Node.js/Container Runtime**: As specified in application

**Testing Framework:**

- **Go**: 1.23+
- **Terratest**: v0.49.0
- **AWS SDK Go v2**: v1.36.3
- **Testify**: v1.10.0

This infrastructure configuration provides a robust, secure, and scalable foundation for the Coalition Builder application with comprehensive documentation and troubleshooting guidance.
