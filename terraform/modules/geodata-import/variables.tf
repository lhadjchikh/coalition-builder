variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the container image"
  type        = string
}

variable "database_secret_arn" {
  description = "ARN of the database connection secret"
  type        = string
}

variable "django_secret_key_arn" {
  description = "ARN of the Django secret key"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for application data"
  type        = string
}