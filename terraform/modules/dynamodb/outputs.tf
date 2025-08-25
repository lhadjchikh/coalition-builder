output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.rate_limits.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.rate_limits.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.rate_limits.id
}

output "lambda_role_arn" {
  description = "ARN of the IAM role for Lambda functions"
  value       = aws_iam_role.lambda_dynamodb_role.arn
}

output "lambda_role_name" {
  description = "Name of the IAM role for Lambda functions"
  value       = aws_iam_role.lambda_dynamodb_role.name
}

output "dynamodb_policy_arn" {
  description = "ARN of the IAM policy for DynamoDB access"
  value       = aws_iam_policy.dynamodb_rate_limits_access.arn
}