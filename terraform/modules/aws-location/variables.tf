variable "prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the endpoint will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for security group rules"
  type        = string
}

variable "private_subnet_id" {
  description = "Single private subnet ID for the VPC endpoint (cost optimization)"
  type        = string
}

variable "ecs_task_role_name" {
  description = "Name of the ECS task IAM role to grant Location Service access"
  type        = string
}