# DynamoDB Module

This module creates a DynamoDB table for serverless rate limiting in Lambda environments.

## Features

- **Pay-per-request billing**: No minimum costs, only pay for actual usage
- **Environment isolation**: Uses partition keys with environment prefixes
- **Automatic cleanup**: TTL-based expiration of old rate limit records
- **Monitoring**: Optional CloudWatch alarms for throttling and capacity
- **Encryption**: Server-side encryption enabled by default
- **Point-in-time recovery**: Optional backup capability

## Usage

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  prefix      = var.prefix
  environment = var.environment
  tags        = local.tags

  # Cost optimization - disable for non-production
  enable_point_in_time_recovery = var.environment == "production"

  # Enable monitoring
  enable_monitoring = true
  alarm_actions    = [aws_sns_topic.alerts.arn]
}
```

## Cost Estimates

- **Table storage**: First 25 GB free
- **Read/Write requests**:
  - First 25M reads free per month
  - First 3.125M writes free per month
- **Typical cost**: ~$1/month for moderate usage across all environments

## Table Schema

| Attribute   | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| pk          | String | Partition key: `{environment}#RATE#{key}` |
| sk          | Number | Sort key: Unix timestamp                  |
| ttl         | Number | TTL timestamp for automatic deletion      |
| environment | String | Environment name                          |
| timestamp   | String | Human-readable timestamp                  |

## Outputs

- `table_name`: Name of the created DynamoDB table
- `table_arn`: ARN for IAM permissions
- `table_id`: Table ID for references
