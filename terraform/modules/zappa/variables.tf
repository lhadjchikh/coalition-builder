variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda security group"
  type        = string
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks of database subnets"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
