output "geolambda_repository_url" {
  description = "URL of the geolambda ECR repository"
  value       = aws_ecr_repository.geolambda.repository_url
}

output "geolambda_repository_name" {
  description = "Name of the geolambda ECR repository"
  value       = aws_ecr_repository.geolambda.name
}

output "lambda_repository_url" {
  description = "URL of the Lambda ECR repository"
  value       = aws_ecr_repository.lambda.repository_url
}

output "lambda_repository_name" {
  description = "Name of the Lambda ECR repository"
  value       = aws_ecr_repository.lambda.name
}
