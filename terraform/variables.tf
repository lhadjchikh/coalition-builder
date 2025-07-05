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
    Project     = "coalition"
    Environment = "Production"
  }
}

# Networking Variables - for using existing VPC/subnets
variable "create_vpc" {
  description = "Whether to create a new VPC (true) or use an existing one (false)"
  type        = bool
  default     = true
}

variable "vpc_id" {
  description = "ID of an existing VPC to use (if create_vpc is false)"
  type        = string
  default     = ""
}

variable "create_public_subnets" {
  description = "Whether to create new public subnets (true) or use existing ones (false)"
  type        = bool
  default     = true
}

# CIDR blocks for new VPC and subnets. These are ignored when using
# existing networking resources but allow tests and custom deployments
# to override the defaults.
variable "vpc_cidr" {
  description = "CIDR block for the VPC when create_vpc is true"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_ids" {
  description = "IDs of existing public subnets to use (if create_public_subnets is false)"
  type        = list(string)
  default     = []
}

variable "public_subnet_a_cidr" {
  description = "CIDR block for public subnet in AZ a when create_public_subnets is true"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
  description = "CIDR block for public subnet in AZ b when create_public_subnets is true"
  type        = string
  default     = "10.0.2.0/24"
}

variable "create_private_subnets" {
  description = "Whether to create new private app subnets (true) or use existing ones (false)"
  type        = bool
  default     = true
}

variable "private_subnet_ids" {
  description = "IDs of existing private app subnets to use (if create_private_subnets is false)"
  type        = list(string)
  default     = []
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for private app subnet in AZ a when create_private_subnets is true"
  type        = string
  default     = "10.0.3.0/24"
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for private app subnet in AZ b when create_private_subnets is true"
  type        = string
  default     = "10.0.4.0/24"
}

variable "create_db_subnets" {
  description = "Whether to create new private database subnets (true) or use existing ones (false)"
  type        = bool
  default     = true
}

variable "db_subnet_ids" {
  description = "IDs of existing private database subnets to use (if create_db_subnets is false)"
  type        = list(string)
  default     = []
}

variable "private_db_subnet_a_cidr" {
  description = "CIDR block for private database subnet in AZ a when create_db_subnets is true"
  type        = string
  default     = "10.0.5.0/24"
}

variable "private_db_subnet_b_cidr" {
  description = "CIDR block for private database subnet in AZ b when create_db_subnets is true"
  type        = string
  default     = "10.0.6.0/24"
}

# Database Variables
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "coalition"
}

# While usernames are not as sensitive as passwords,
# they still should not be hardcoded for production environments
variable "db_username" {
  description = "Database master username (default value only for initial setup)"
  type        = string
  default     = "postgres_admin" # Default value used only for development
}

# Only used for initial setup or when Secrets Manager integration is disabled
# In production environments, this should be managed through Secrets Manager
variable "db_password" {
  description = "Database master password (only used for initial setup, then stored in Secrets Manager)"
  type        = string
  sensitive   = true
}

variable "app_db_username" {
  description = "Application database username with restricted privileges (default value only for initial setup)"
  type        = string
  default     = "app_user" # Default value used only for development
}

variable "app_db_password" {
  description = "Application database password (only used for initial setup, then stored in Secrets Manager)"
  type        = string
  sensitive   = true
  default     = "" # Will be auto-generated if empty
}

variable "db_allocated_storage" {
  description = "Allocated storage for the database in GB"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "Version of PostgreSQL to use"
  type        = string
  default     = "16.9"
}

variable "db_instance_class" {
  description = "Instance class for the database"
  type        = string
  default     = "db.t4g.micro"
}

variable "auto_setup_database" {
  description = "Whether to automatically run database setup after RDS creation"
  type        = bool
  default     = false # Default to manual for safety
}

variable "prevent_destroy" {
  description = "Whether to prevent destruction of database resources (set to false for testing)"
  type        = bool
  default     = true
}

# DNS and SSL Variables
variable "route53_zone_id" {
  description = "The Route 53 zone ID to create records in"
  type        = string
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
}

variable "acm_certificate_arn" {
  description = "The ARN of the ACM certificate to use for HTTPS"
  type        = string
}


# Monitoring Variables
variable "alert_email" {
  description = "Email address to receive budget and other alerts"
  type        = string
}

variable "budget_limit_amount" {
  description = "Monthly budget limit amount in USD"
  type        = string
  default     = "100"
}

# Bastion Host Variables
variable "allowed_bastion_cidrs" {
  description = "List of CIDR blocks allowed to access the bastion host"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Replace with your IP address for security
}

variable "bastion_key_name" {
  description = "SSH key pair name for the bastion host"
  type        = string
  default     = "coalition-bastion"
}

variable "bastion_public_key" {
  description = "SSH public key for the bastion host (leave empty to skip key pair creation)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "create_new_key_pair" {
  description = "Whether to create a new key pair or use an existing one. Set to false if the key pair already exists in AWS."
  type        = bool
  default     = false
}

variable "enable_ssr" {
  description = "Enable Server-Side Rendering with Node.js"
  type        = bool
  default     = true
}

variable "health_check_path_api" {
  description = "Path for backend container and load balancer health checks"
  type        = string
  default     = "/health/"
}

variable "health_check_path_ssr" {
  description = "Path for frontend container and load balancer health checks"
  type        = string
  default     = "/health"
}

variable "allowed_hosts" {
  description = "Django ALLOWED_HOSTS setting - should include localhost for health checks"
  type        = string
  default     = "localhost,127.0.0.1"
}

variable "csrf_trusted_origins" {
  description = "Django CSRF_TRUSTED_ORIGINS setting"
  type        = string
  default     = ""
}

variable "enable_single_az_endpoints" {
  description = "Deploy VPC endpoints in a single AZ to reduce costs (saves ~50% on endpoint costs)"
  type        = bool
  default     = true
}

# Site Password Protection Variables
variable "site_password_enabled" {
  description = "Enable password protection for the entire site during development"
  type        = bool
  default     = false
}

variable "site_password" {
  description = "Password for site access when password protection is enabled"
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.site_password_enabled == false || var.site_password != ""
    error_message = "site_password must be provided when site_password_enabled is true."
  }
}

variable "site_username" {
  description = "Username for site password protection"
  type        = string
  default     = "admin"
}

# Static Assets Storage Variables
variable "static_assets_force_destroy" {
  description = "Whether to force destroy buckets even if they contain objects"
  type        = bool
  default     = false
}

variable "static_assets_cors_origins" {
  description = "List of allowed origins for CORS configuration on static assets bucket"
  type        = list(string)
  default     = ["*"]
}

variable "static_assets_enable_versioning" {
  description = "Whether to enable versioning on the static assets bucket"
  type        = bool
  default     = true
}

variable "static_assets_enable_lifecycle" {
  description = "Whether to enable lifecycle rules for cost optimization on static assets"
  type        = bool
  default     = true
}
