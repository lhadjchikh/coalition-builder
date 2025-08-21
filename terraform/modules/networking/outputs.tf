output "vpc_id" {
  description = "The ID of the VPC"
  value       = local.vpc_id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = local.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = local.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private app subnet IDs"
  value       = local.private_subnet_ids
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  value       = local.private_db_subnet_ids
}

output "app_subnet_cidrs" {
  description = "List of private app subnet CIDR blocks"
  value       = var.create_private_subnets ? [var.private_subnet_a_cidr, var.private_subnet_b_cidr] : []
}

output "db_subnet_cidrs" {
  description = "List of private database subnet CIDR blocks"
  value       = var.create_db_subnets ? [var.private_db_subnet_a_cidr, var.private_db_subnet_b_cidr] : []
}

output "s3_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "s3_endpoint_prefix_list_id" {
  description = "Prefix list ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.prefix_list_id
}

output "private_app_route_table_id" {
  description = "ID of the private app route table (for testing purposes)"
  value       = length(aws_route_table.private_app) > 0 ? aws_route_table.private_app[0].id : null
}