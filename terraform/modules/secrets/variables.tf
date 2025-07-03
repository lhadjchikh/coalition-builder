variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
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

variable "site_password_enabled" {
  description = "Enable password protection for the entire site"
  type        = bool
  default     = false
}

variable "site_password" {
  description = "Password for site access when password protection is enabled"
  type        = string
  sensitive   = true
  default     = ""
}