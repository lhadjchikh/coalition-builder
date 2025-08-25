output "s3_bucket_name" {
  description = "Name of the S3 bucket for Zappa deployments"
  value       = aws_s3_bucket.zappa_deployments.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Zappa deployments"
  value       = aws_s3_bucket.zappa_deployments.arn
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "zappa_deployment_role_arn" {
  description = "ARN of the IAM role for Zappa deployments"
  value       = aws_iam_role.zappa_deployment.arn
}

output "zappa_deployment_role_name" {
  description = "Name of the IAM role for Zappa deployments"
  value       = aws_iam_role.zappa_deployment.name
}