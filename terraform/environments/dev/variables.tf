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
    Environment = "dev"
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
  description = "CIDR block for the dev VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for private app subnet A"
  type        = string
  default     = "10.2.3.0/24"
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for private app subnet B"
  type        = string
  default     = "10.2.4.0/24"
}

# Database (in shared account, accessed via peering)
variable "db_name" {
  description = "Database name in the shared RDS instance (dev database)"
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

# GitHub OIDC
variable "github_repo" {
  description = "GitHub repository in org/repo format"
  type        = string
}
