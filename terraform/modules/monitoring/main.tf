# Monitoring Module

# Random suffix for S3 bucket to ensure global uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${var.prefix}-alb-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name = "${var.prefix}-alb-logs"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    filter {
      prefix = "" # Empty prefix to apply to all objects
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        },
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow",
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        },
        Action   = "s3:GetBucketAcl",
        Resource = aws_s3_bucket.alb_logs.arn
      },
      {
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
        },
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

data "aws_elb_service_account" "main" {}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log_group" {
  name              = "/vpc/flow-logs"
  retention_in_days = 30

  tags = {
    Name = "${var.prefix}-vpc-flow-logs"
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "vpc-flow-log-role"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log_group.arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id

  tags = {
    Name = "${var.prefix}-vpc-flow-logs"
  }
}

# SNS Topic for Budget Alerts
resource "aws_sns_topic" "budget_alerts" {
  name = "${var.prefix}-budget-alerts"

  tags = {
    Name = "${var.prefix}-budget-alerts"
  }
}

# SNS Topic Subscription for Budget Email Alerts
resource "aws_sns_topic_subscription" "budget_email" {
  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Budget Monitoring
resource "aws_budgets_budget" "monthly" {
  name              = "${var.prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.budget_limit_amount
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = formatdate("YYYY-MM-01_00:00", timestamp())
  # Add a reasonable end date (5 years in the future)
  time_period_end = formatdate("YYYY-MM-01_00:00", timeadd(timestamp(), "43800h")) # ~5 years

  # Define cost types explicitly to avoid warnings
  cost_types {
    include_credit             = true
    include_discount           = true
    include_other_subscription = true
    include_recurring          = true
    include_refund             = false
    include_subscription       = true
    include_tax                = true
    include_upfront            = true
    use_amortized              = false
    use_blended                = false
  }

  # Add cost allocation tag to the budget
  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$${var.prefix}"]
  }

  # Early warning at 70% of budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 70
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  # Near limit warning at 90% of budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 90
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  # Forecast warning if we're projected to exceed budget
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  tags = {
    Name = "${var.prefix}-monthly-budget"
  }
}

# Cost Anomaly Detection
resource "awscc_ce_anomaly_monitor" "project_anomaly_monitor" {
  monitor_name = "${var.prefix}-anomaly-monitor"
  monitor_type = "DIMENSIONAL"

  monitor_specification = jsonencode({
    Dimension    = "SERVICE"
    Key          = "SERVICE"
    Values       = ["Amazon Elastic Compute Cloud - Compute", "Amazon Relational Database Service", "Amazon Virtual Private Cloud", "Amazon Elastic Container Service", "Amazon Elastic Container Registry (ECR)"]
    MatchOptions = ["EQUALS"]
  })
}

# SNS Topic for Cost Anomaly Alerts
resource "aws_sns_topic" "cost_anomaly_alerts" {
  name = "${var.prefix}-cost-anomaly-alerts"

  tags = {
    Name = "${var.prefix}-cost-anomaly-alerts"
  }
}

# SNS Topic Subscription for Email Alerts
resource "aws_sns_topic_subscription" "cost_anomaly_email" {
  topic_arn = aws_sns_topic.cost_anomaly_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Cost Anomaly Subscription
resource "awscc_ce_anomaly_subscription" "project_anomaly_subscription" {
  subscription_name = "${var.prefix}-anomaly-subscription"
  frequency         = "DAILY"

  monitor_arn_list = [
    awscc_ce_anomaly_monitor.project_anomaly_monitor.arn
  ]

  subscribers = [
    {
      type    = "EMAIL"
      address = var.alert_email
    },
    {
      type    = "SNS"
      address = aws_sns_topic.cost_anomaly_alerts.arn
    }
  ]

  # Alert on anomalies with impact >= $5
  threshold_expression = jsonencode({
    And = [{
      Dimensions = {
        Key          = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        Values       = ["5"]
        MatchOptions = ["GREATER_THAN_OR_EQUAL"]
      }
    }]
  })
}

