variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
}

variable "aws_location_place_index_name" {
  description = "Name of the AWS Location place index for geocoding"
  type        = string
  default     = ""
}

variable "aws_location_policy_arn" {
  description = "ARN of the AWS Location IAM policy to attach to the ECS task role"
  type        = string
  default     = ""
}

variable "task_cpu" {
  description = "CPU units for the task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.task_cpu)
    error_message = "Task CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "task_memory" {
  description = "Memory for the task in MiB. Must be compatible with CPU value."
  type        = number
  default     = null # When null, will be calculated based on CPU

  validation {
    condition     = var.task_memory == null || var.task_memory >= 512
    error_message = "Task memory must be at least 512 MiB."
  }
}

# Add locals to calculate appropriate memory based on CPU and SSR settings
locals {
  # Calculate appropriate memory if not specified
  calculated_memory = var.task_memory != null ? var.task_memory : (
    # For dual container (API + Frontend), use higher memory
    var.task_cpu == 256 ? 1024 :  # 256 CPU -> 1GB
    var.task_cpu == 512 ? 2048 :  # 512 CPU -> 2GB  
    var.task_cpu == 1024 ? 4096 : # 1024 CPU -> 4GB
    var.task_cpu == 2048 ? 8192 : # 2048 CPU -> 8GB
    16384                         # 4096 CPU -> 16GB
  )
}

variable "container_port_api" {
  description = "Container port for API"
  type        = number
  default     = 8000
}

variable "container_port_app" {
  description = "Container port for app (frontend)"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired count of tasks"
  type        = number
  default     = 1
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ECS service"
  type        = list(string)
}

variable "public_subnet_id" {
  description = "Public subnet ID for the bastion host"
  type        = string
}

variable "app_security_group_id" {
  description = "ID of the application security group"
  type        = string
}

variable "bastion_security_group_id" {
  description = "ID of the bastion security group"
  type        = string
}

variable "db_url_secret_arn" {
  description = "ARN of the database URL secret"
  type        = string
}

variable "secret_key_secret_arn" {
  description = "ARN of the Django secret key secret"
  type        = string
}

variable "secrets_kms_key_arn" {
  description = "ARN of the KMS key used for Secrets Manager"
  type        = string
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

  validation {
    condition     = var.bastion_public_key == "" || length(var.bastion_public_key) <= 2048
    error_message = "The bastion_public_key exceeds AWS's limit of 2048 characters."
  }
}

variable "create_new_key_pair" {
  description = "Whether to create a new key pair or use an existing one. Set to false if the key pair already exists in AWS."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "The domain name for the application (used in SSR environment variables)"
  type        = string
  default     = ""
}

# Variables for SSR target group
variable "api_target_group_arn" {
  description = "ARN of the API target group for the ECS service"
  type        = string
  default     = ""
}

variable "app_target_group_arn" {
  description = "ARN of the app (frontend) target group for the ECS service"
  type        = string
}


variable "health_check_path_api" {
  description = "Path for load balancer health checks on Django backend"
  type        = string
  default     = "/api/health"
}

variable "redis_cpu" {
  description = "CPU units for Redis container"
  type        = number
  default     = 128

  validation {
    condition     = var.redis_cpu >= 64 && var.redis_cpu <= 512
    error_message = "Redis CPU must be between 64 and 512 CPU units."
  }

  validation {
    condition     = var.redis_cpu < var.task_cpu
    error_message = "Redis CPU allocation must be less than total task CPU to ensure adequate resources for application containers."
  }
}

variable "redis_memory" {
  description = "Memory in MiB for Redis container"
  type        = number
  default     = 128

  validation {
    condition     = var.redis_memory >= 64 && var.redis_memory <= 1024
    error_message = "Redis memory must be between 64 and 1024 MiB."
  }

  validation {
    condition     = var.task_memory == null || var.redis_memory < var.task_memory
    error_message = "Redis memory allocation must be less than total task memory when task_memory is explicitly set."
  }

  validation {
    # Ensure Redis memory doesn't exceed calculated minimums for any CPU level
    condition     = var.redis_memory < 1024
    error_message = "Redis memory allocation is too high for the minimum calculated memory allocation. Reduce redis_memory or increase task_cpu."
  }
}

variable "redis_version" {
  description = "Redis Docker image version tag"
  type        = string
  default     = "8-alpine"

  validation {
    condition     = can(regex("^[a-zA-Z0-9.-]+$", var.redis_version))
    error_message = "Redis version must be a valid Docker tag."
  }
}

variable "allowed_hosts" {
  description = "Django ALLOWED_HOSTS setting - should include localhost for health checks"
  type        = string
  default     = "localhost,127.0.0.1"
}

variable "alb_dns_name" {
  description = "ALB DNS name to include in Django ALLOWED_HOSTS for health checks"
  type        = string
}

variable "csrf_trusted_origins" {
  description = "Django CSRF_TRUSTED_ORIGINS setting"
  type        = string
  default     = ""
}

# Site Password Protection Variables
variable "site_password_enabled" {
  description = "Enable password protection for the entire site during development"
  type        = bool
  default     = false
}

variable "site_password_secret_arn" {
  description = "ARN of the site password secret"
  type        = string
}

variable "site_username" {
  description = "Username for site password protection"
  type        = string
  default     = "admin"
}

variable "static_assets_upload_policy_arn" {
  description = "ARN of the IAM policy for uploading to static assets bucket"
  type        = string
}

variable "static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  type        = string
  default     = ""
}

variable "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for static assets"
  type        = string
  default     = ""
}

