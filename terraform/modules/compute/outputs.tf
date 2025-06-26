output "api_ecr_repository_url" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "ssr_ecr_repository_url" {
  description = "URL of the SSR ECR repository"
  value       = aws_ecr_repository.ssr.repository_url
}

output "redis_ecr_repository_url" {
  description = "URL of the Redis ECR repository"
  value       = aws_ecr_repository.redis.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "bastion_key_pair_created" {
  description = "Whether the bastion key pair was created"
  value       = var.create_new_key_pair && length(aws_key_pair.bastion) > 0
}

output "bastion_key_pair_name" {
  description = "Name of the bastion key pair"
  value       = var.bastion_key_name
}

output "bastion_public_ip" {
  description = "Public IP address of the bastion host (Elastic IP)"
  value       = aws_eip.bastion.public_ip
}