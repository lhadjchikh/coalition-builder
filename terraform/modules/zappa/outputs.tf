output "s3_bucket_name" {
  description = "Name of the S3 bucket for Zappa deployments"
  value       = aws_s3_bucket.zappa_deployments.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Zappa deployments"
  value       = aws_s3_bucket.zappa_deployments.arn
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group (null if no VPC configured)"
  value       = length(aws_security_group.lambda) > 0 ? aws_security_group.lambda[0].id : null
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API Zappa created for this stage (empty string when discovery is disabled)"
  value       = var.discover_api_gateway ? data.aws_api_gateway_rest_api.zappa[0].id : ""
}

output "zappa_deployment_role_arn" {
  description = "ARN of the IAM role for Zappa deployments"
  value       = aws_iam_role.zappa_deployment.arn
}

output "zappa_deployment_role_name" {
  description = "Name of the IAM role for Zappa deployments"
  value       = aws_iam_role.zappa_deployment.name
}
