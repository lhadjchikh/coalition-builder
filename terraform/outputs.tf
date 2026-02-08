# Network Outputs
output "vpc_id" {
  value = module.networking.vpc_id
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

# Database Outputs
output "database_endpoint" {
  value = module.database.db_instance_endpoint
}

output "database_name" {
  value = module.database.db_instance_name
}

# Bastion Host Outputs
output "bastion_public_ip" {
  value       = module.bastion.bastion_public_ip
  description = "Public IP address of the bastion host"
}

output "ssh_tunnel_command" {
  value       = "ssh -i ${var.bastion_key_name}.pem ec2-user@${module.bastion.bastion_public_ip} -L 5432:${module.database.db_instance_address}:5432"
  description = "Command to create SSH tunnel for database access"
}

output "pgadmin_connection_info" {
  value       = <<-EOT
    Set up pgAdmin with:
    - Host: localhost
    - Port: 5432
    - Username: ${var.db_username}
    - Database: ${var.db_name}

    Important: Connect to SSH tunnel first using the command above
  EOT
  description = "Connection information for pgAdmin"
  sensitive   = true
}

# Monitoring Outputs
output "budget_info" {
  value = module.monitoring.budget_info
}

output "cost_anomaly_monitor_arn" {
  description = "ARN of the cost anomaly monitor for monitoring unusual spending"
  value       = module.monitoring.cost_anomaly_monitor_arn
}

output "cost_anomaly_subscription_arn" {
  description = "ARN of the cost anomaly subscription for daily alerts"
  value       = module.monitoring.cost_anomaly_subscription_arn
}

output "cost_anomaly_sns_topic_arn" {
  description = "ARN of the SNS topic for cost anomaly alerts"
  value       = module.monitoring.cost_anomaly_sns_topic_arn
}

output "budget_alerts_sns_topic_arn" {
  description = "ARN of the SNS topic for budget alerts"
  value       = module.monitoring.budget_alerts_sns_topic_arn
}

# Simple deployment status
output "deployment_status" {
  description = "Overall deployment status"
  value       = "Infrastructure deployment completed successfully!"
}

# Database setup status
output "database_setup_status" {
  description = "Database setup status"
  value       = var.auto_setup_database ? "Database setup completed automatically" : "Manual database setup required"
}

# Storage Module Outputs
output "static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = module.storage.static_assets_bucket_name
}

output "static_assets_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = module.storage.static_assets_bucket_arn
}

output "static_assets_bucket_url" {
  description = "URL of the S3 bucket for static assets"
  value       = "https://${module.storage.static_assets_bucket_domain_name}"
}

output "static_assets_upload_policy_arn" {
  description = "ARN of the IAM policy for uploading to the static assets bucket"
  value       = module.storage.static_assets_upload_policy_arn
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution for static assets"
  value       = module.storage.cloudfront_distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for static assets"
  value       = module.storage.cloudfront_distribution_id
}

# Serverless Storage Outputs (Lambda deployment)
output "serverless_bucket_names" {
  description = "Map of environment to S3 bucket names for serverless deployments"
  value       = module.serverless_storage.bucket_names
}

output "serverless_bucket_configuration" {
  description = "Configuration summary for all serverless S3 buckets"
  value       = module.serverless_storage.configuration_summary
}

output "serverless_cloudfront_domains" {
  description = "CloudFront domains for serverless buckets (if enabled)"
  value       = module.serverless_storage.cloudfront_domains
}

output "serverless_lambda_policy_arns" {
  description = "IAM policy ARNs for Lambda to access S3 buckets"
  value       = module.serverless_storage.lambda_s3_policy_arns
}

# Lambda ECR Outputs
output "geolambda_repository_url" {
  description = "URL of the geolambda ECR repository"
  value       = module.lambda_ecr.geolambda_repository_url
}

output "lambda_repository_url" {
  description = "URL of the Lambda ECR repository"
  value       = module.lambda_ecr.lambda_repository_url
}

# Summary output
output "deployment_summary" {
  description = "Complete deployment summary"
  value       = <<-EOT
DEPLOYMENT COMPLETE

Database: ${module.database.db_instance_endpoint}
Bastion: ${module.bastion.bastion_public_ip}
Static Assets: https://${module.storage.static_assets_bucket_domain_name}

EOT
}

# Zappa Outputs
output "zappa_deployment_role_name" {
  description = "Name of the IAM role for Zappa Lambda execution"
  value       = module.zappa.zappa_deployment_role_name
}

output "zappa_deployment_role_arn" {
  description = "ARN of the IAM role for Zappa Lambda execution"
  value       = module.zappa.zappa_deployment_role_arn
}

output "zappa_s3_bucket" {
  description = "S3 bucket for Zappa deployment packages"
  value       = module.zappa.s3_bucket_name
}

output "zappa_lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  value       = module.zappa.lambda_security_group_id
}
