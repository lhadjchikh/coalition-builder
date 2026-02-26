variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda security group (optional, leave empty if Lambda doesn't need VPC access)"
  type        = string
  default     = ""
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks of database subnets (optional)"
  type        = list(string)
  default     = []
}

variable "create_lambda_sg" {
  description = "Whether to create the Lambda security group (use this instead of vpc_id to avoid unknown-at-plan-time issues)"
  type        = bool
  default     = false
}

variable "secret_arns" {
  description = "ARNs of Secrets Manager secrets the Lambda function needs to read"
  type        = list(string)
  default     = []
}

variable "secrets_kms_key_arn" {
  description = "ARN of the KMS key used to encrypt secrets (required if secret_arns is non-empty)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
