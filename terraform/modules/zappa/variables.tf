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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
