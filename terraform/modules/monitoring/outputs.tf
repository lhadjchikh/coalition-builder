output "alb_logs_bucket" {
  description = "Name of the S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "vpc_flow_logs_group" {
  description = "Name of the CloudWatch log group for VPC flow logs"
  value       = aws_cloudwatch_log_group.vpc_flow_log_group.name
}

output "budget_info" {
  description = "Budget configuration summary"
  value       = "Monthly budget alert of $${aws_budgets_budget.monthly.limit_amount} set with notifications at 70%, 90%, and forecast thresholds to ${var.alert_email}"
}

output "cost_anomaly_detector_arn" {
  description = "ARN of the cost anomaly detector"
  value       = aws_ce_anomaly_detector.project_anomaly_detector.arn
}

output "cost_anomaly_subscription_arn" {
  description = "ARN of the cost anomaly subscription"
  value       = aws_ce_anomaly_subscription.project_anomaly_subscription.arn
}

output "cost_anomaly_sns_topic_arn" {
  description = "ARN of the SNS topic for cost anomaly alerts"
  value       = aws_sns_topic.cost_anomaly_alerts.arn
}