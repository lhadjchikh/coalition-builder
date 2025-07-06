variable "prefix" {
  description = "Prefix for all resources"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer for Django static files"
  type        = string
}

variable "force_destroy" {
  description = "Whether to force destroy the bucket even if it contains objects"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS configuration"
  type        = list(string)
  default     = ["*"]
}

variable "enable_versioning" {
  description = "Whether to enable versioning on the bucket"
  type        = bool
  default     = true
}

variable "enable_lifecycle_rules" {
  description = "Whether to enable lifecycle rules for cost optimization"
  type        = bool
  default     = true
}

variable "noncurrent_version_expiration_days" {
  description = "Number of days after which to expire noncurrent versions"
  type        = number
  default     = 30
}