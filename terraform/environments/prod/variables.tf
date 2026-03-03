variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "coalition-builder"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

# Cross-account references
variable "shared_account_id" {
  description = "AWS account ID of the shared account"
  type        = string
}

variable "shared_peering_role_arn" {
  description = "IAM role ARN in the shared account for VPC peering acceptance"
  type        = string
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for the prod VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "public_subnet_a_cidr" {
  description = "CIDR block for public subnet A"
  type        = string
  default     = "10.1.1.0/24"
}

variable "public_subnet_b_cidr" {
  description = "CIDR block for public subnet B"
  type        = string
  default     = "10.1.2.0/24"
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for private app subnet A"
  type        = string
  default     = "10.1.3.0/24"
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for private app subnet B"
  type        = string
  default     = "10.1.4.0/24"
}

# Database (in shared account, accessed via peering)
variable "db_name" {
  description = "Database name in the shared RDS instance"
  type        = string
  default     = "coalition"
}

variable "app_db_username" {
  description = "Application database username"
  type        = string
}

variable "app_db_password" {
  description = "Application database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "site_password" {
  description = "Password for site access protection"
  type        = string
  default     = ""
  sensitive   = true
}

# Domain & DNS
variable "domain_name" {
  description = "The domain name for the application"
  type        = string
}

variable "api_gateway_id" {
  description = "The ID of the Zappa-managed API Gateway REST API"
  type        = string
  default     = ""
}

variable "api_gateway_stage" {
  description = "The stage name of the API Gateway"
  type        = string
  default     = "prod"
}

# SES
variable "ses_from_email" {
  description = "Default from email address for SES"
  type        = string
}

variable "ses_notification_email" {
  description = "Email address for SES notifications"
  type        = string
}

# Monitoring
variable "alert_email" {
  description = "Email address to receive alerts"
  type        = string
}

variable "budget_limit_amount" {
  description = "Monthly budget limit amount in USD"
  type        = string
  default     = "100"
}

# GitHub OIDC
variable "github_repo" {
  description = "GitHub repository in org/repo format"
  type        = string
}
