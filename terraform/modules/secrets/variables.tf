variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
}

variable "environment" {
  description = "Application environment that owns these secrets"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}

variable "app_db_username" {
  description = "Application database username"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "app_db_password" {
  description = "Application database password (only used for initial setup, then stored in Secrets Manager)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "site_password" {
  description = "Password for site access (empty string will use 'changeme' as fallback in secret)"
  type        = string
  sensitive   = true
  default     = ""
}
