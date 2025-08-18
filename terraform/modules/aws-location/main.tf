# AWS Location Service for internal geocoding

# Create a place index for geocoding
resource "aws_location_place_index" "geocoding" {
  index_name  = "${var.prefix}-geocoding-index"
  data_source = var.location_data_source # Configurable data source (default: Esri for US coverage)
  # Note: pricing_plan removed as it's deprecated - AWS now uses pay-per-request by default

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
          "geo:SearchPlaceIndexForPosition",
          "geo:SearchPlaceIndexForSuggestions",
          "geo:GetPlace"
        ]
        Resource = aws_location_place_index.geocoding.index_arn
      }
    ]
  })
}

# NOTE: The policy attachment is handled in the compute module to avoid circular dependency
# The compute module will attach this policy to the ECS task role