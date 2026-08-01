variable "environment" {
  description = "Environment name (e.g., dev, prod) — used for ECR repository naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "image_retention_count" {
  description = "Number of recent Lambda images to retain for rollback"
  type        = number
  default     = 10

  validation {
    condition     = var.image_retention_count >= 1 && floor(var.image_retention_count) == var.image_retention_count
    error_message = "image_retention_count must be a positive integer."
  }
}
