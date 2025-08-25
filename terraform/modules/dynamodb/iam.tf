# IAM policy for Lambda functions to access DynamoDB rate limits table
resource "aws_iam_policy" "dynamodb_rate_limits_access" {
  name        = "${var.prefix}-dynamodb-rate-limits-access"
  path        = "/"
  description = "IAM policy for Lambda functions to access DynamoDB rate limits table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:DeleteItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.rate_limits.arn,
          "${aws_dynamodb_table.rate_limits.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive"
        ]
        Resource = aws_dynamodb_table.rate_limits.arn
      }
    ]
  })

  tags = var.tags
}

# IAM role for Lambda execution with DynamoDB access
resource "aws_iam_role" "lambda_dynamodb_role" {
  name = "${var.prefix}-lambda-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach the DynamoDB access policy to the Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_policy" {
  role       = aws_iam_role.lambda_dynamodb_role.name
  policy_arn = aws_iam_policy.dynamodb_rate_limits_access.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_dynamodb_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach VPC execution policy if Lambda needs VPC access
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_dynamodb_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}