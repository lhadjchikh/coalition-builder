# AWS Location Service for internal geocoding

# Create a place index for geocoding
resource "aws_location_place_index" "geocoding" {
  index_name   = "${var.prefix}-geocoding-index"
  data_source  = "Esri"              # Esri provides good US address coverage
  pricing_plan = "RequestBasedUsage" # Pay per request, no commitment

  tags = {
    Name        = "${var.prefix}-geocoding-index"
    Environment = var.environment
  }
}

# VPC endpoint for AWS Location Service (single AZ for cost savings)
resource "aws_vpc_endpoint" "location" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.geo"
  vpc_endpoint_type = "Interface"

  # Single AZ deployment for cost savings
  subnet_ids = [var.private_subnet_id]

  security_group_ids = [aws_security_group.location_endpoint.id]

  private_dns_enabled = true

  tags = {
    Name        = "${var.prefix}-location-endpoint"
    Environment = var.environment
  }
}

# Security group for VPC endpoint
resource "aws_security_group" "location_endpoint" {
  name_prefix = "${var.prefix}-location-endpoint-"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.prefix}-location-endpoint-sg"
  }
}

# IAM policy for ECS tasks to use AWS Location Service
resource "aws_iam_policy" "location_access" {
  name_prefix = "${var.prefix}-location-access-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "geo:SearchPlaceIndexForText",
          "geo:SearchPlaceIndexForPosition"
        ]
        Resource = aws_location_place_index.geocoding.arn
      }
    ]
  })
}

# Attach the policy to the ECS task execution role
resource "aws_iam_role_policy_attachment" "ecs_location_access" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.location_access.arn
}