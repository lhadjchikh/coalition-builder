variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
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
  default     = null # When null, will be calculated based on enable_ssr and CPU

  validation {
    condition     = var.task_memory == null || var.task_memory >= 512
    error_message = "Task memory must be at least 512 MiB."
  }
}

# Add locals to calculate appropriate memory based on CPU and SSR settings
locals {
  # Calculate appropriate memory if not specified
  calculated_memory = var.task_memory != null ? var.task_memory : (
    var.enable_ssr ? (
      # For SSR (dual container), use higher memory
      var.task_cpu == 256 ? 1024 :  # 256 CPU -> 1GB
      var.task_cpu == 512 ? 2048 :  # 512 CPU -> 2GB  
      var.task_cpu == 1024 ? 4096 : # 1024 CPU -> 4GB
      var.task_cpu == 2048 ? 8192 : # 2048 CPU -> 8GB
      16384                         # 4096 CPU -> 16GB
      ) : (
      # For API-only (single container), use lower memory
      var.task_cpu == 256 ? 512 :   # 256 CPU -> 512MB
      var.task_cpu == 512 ? 1024 :  # 512 CPU -> 1GB
      var.task_cpu == 1024 ? 2048 : # 1024 CPU -> 2GB
      var.task_cpu == 2048 ? 4096 : # 2048 CPU -> 4GB
      8192                          # 4096 CPU -> 8GB
    )
  )
}

variable "container_port_api" {
  description = "Container port for API"
  type        = number
  default     = 8000
}

variable "container_port_ssr" {
  description = "Container port for SSR"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired count of tasks"
  type        = number
  default     = 1
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the ECS service"
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

variable "ssr_target_group_arn" {
  description = "ARN of the SSR target group for the ECS service"
  type        = string
  default     = ""
}

variable "enable_ssr" {
  description = "Enable Server-Side Rendering with Node.js"
  type        = bool
  default     = true
}

variable "health_check_path_api" {
  description = "Path for load balancer health checks on Django backend"
  type        = string
  default     = "/health/"
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
    condition     = var.redis_memory < (var.enable_ssr ? 1024 : 512)
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
  description = "ARN of the site password secret (empty if not enabled)"
  type        = string
  default     = ""
}

