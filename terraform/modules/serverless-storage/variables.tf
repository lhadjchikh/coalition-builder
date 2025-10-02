variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "coalition-builder"
}

variable "bucket_prefix" {
  description = "Prefix for bucket names (without environment suffix)"
  type        = string
  default     = "coalition"
}

variable "use_random_suffix" {
  description = "Whether to add random suffix to bucket names for uniqueness. Set to false if you want predictable names."
  type        = bool
  default     = true
}

variable "force_destroy_non_production" {
  description = "Whether to force destroy non-production buckets even if they contain objects"
  type        = bool
  default     = true
}

variable "enable_lifecycle_rules" {
  description = "Whether to enable lifecycle rules for cost optimization on non-production buckets"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Whether to create CloudFront distributions for staging and production"
  type        = bool
  default     = false
}

variable "production_cors_origins" {
  description = "Allowed CORS origins for production bucket"
  type        = list(string)
  default     = ["https://example.com", "https://www.example.com"]
}

variable "production_ip_whitelist" {
  description = "IP addresses allowed to access production bucket (leave empty for public access)"
  type        = list(string)
  default     = []
}