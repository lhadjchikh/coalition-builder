resource "aws_dynamodb_table" "rate_limits" {
  name         = "${var.prefix}-rate-limits"
  billing_mode = "PAY_PER_REQUEST" # No minimum cost, pay only for what you use

  # Partition key for environment isolation
  hash_key = "pk"
  # Sort key for timestamp-based queries
  range_key = "sk"

  attribute {
    name = "pk"
    type = "S" # String type for environment#RATE#key format
  }

  attribute {
    name = "sk"
    type = "N" # Number type for timestamp
  }

  # TTL configuration for automatic cleanup
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.prefix}-rate-limits"
      Purpose     = "Rate limiting for Lambda functions"
      Environment = var.environment
    }
  )
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "throttled_requests" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.prefix}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttled requests"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.rate_limits.name
  }

  alarm_actions = var.alarm_actions

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "consumed_read_capacity" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.prefix}-dynamodb-consumed-reads"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000" # Adjust based on expected traffic
  alarm_description   = "This metric monitors DynamoDB read capacity consumption"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.rate_limits.name
  }

  alarm_actions = var.alarm_actions

  tags = var.tags
}