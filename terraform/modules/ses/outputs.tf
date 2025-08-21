output "ses_smtp_secret_arn" {
  description = "ARN of the Secrets Manager secret containing SMTP credentials"
  value       = aws_secretsmanager_secret.ses_smtp.arn
}

output "ses_smtp_secret_name" {
  description = "Name of the Secrets Manager secret containing SMTP credentials"
  value       = aws_secretsmanager_secret.ses_smtp.name
}

output "ses_domain_identity" {
  description = "The SES domain identity"
  value       = var.verify_domain ? aws_ses_domain_identity.main[0].domain : null
}

output "ses_verification_token" {
  description = "The verification token for the domain (if not using Route53)"
  value       = var.verify_domain ? aws_ses_domain_identity.main[0].verification_token : null
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for the domain (if not using Route53)"
  value       = var.verify_domain ? aws_ses_domain_dkim.main[0].dkim_tokens : []
}

output "ses_smtp_username" {
  description = "SMTP username for SES"
  value       = aws_iam_access_key.ses_smtp.id
  sensitive   = true
}

output "ses_configuration_set" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.main.name
}

output "ses_notification_topic_arn" {
  description = "ARN of the SNS topic for SES notifications"
  value       = var.enable_notifications ? aws_sns_topic.ses_notifications[0].arn : null
}

output "smtp_endpoint" {
  description = "SES SMTP endpoint"
  value       = "email-smtp.${var.aws_region}.amazonaws.com"
}

output "smtp_port" {
  description = "SES SMTP port"
  value       = 587
}